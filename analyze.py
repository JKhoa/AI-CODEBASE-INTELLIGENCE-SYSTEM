"""
Static analysis helpers for the AI Codebase Intelligence backend.

Three concerns live here:

  1. AST / import extraction  → produce a module dependency graph that the
     UI can render as the architecture diagram (ARCH_NODES + ARCH_EDGES).
  2. Dependency manifest → CVE / supply-chain audit via OSV.dev (free, no
     key required).
  3. Markdown documentation generator from a finished session record.

We deliberately keep parsing cheap: Python uses the stdlib `ast`, every
other language uses pragmatic regexes that pull `import`/`require` strings.
This is far from a complete static analyzer — the goal is "good enough to
draw a sensible block diagram" not "build a compiler".
"""
from __future__ import annotations

import ast
import json
import re
from collections import Counter, defaultdict
from typing import Any, Iterable

import httpx


# ---------------------------------------------------------------------------
# 1. Import extraction
# ---------------------------------------------------------------------------
_RE_JS_IMPORT = re.compile(
    r"""(?:import\s+(?:.+?\s+from\s+)?|require\s*\(\s*)['"]([^'"]+)['"]""",
    re.MULTILINE,
)
_RE_GO_IMPORT = re.compile(
    r"""import\s*\(\s*([^)]+)\)|import\s+['"]([^'"]+)['"]""",
    re.DOTALL,
)
_RE_RUST_USE = re.compile(r"^\s*use\s+([\w:\{\},\s]+);", re.MULTILINE)


def extract_imports(path: str, content: str) -> list[str]:
    """Return a list of imported module names found in `content`."""
    ext = path.rsplit(".", 1)[-1].lower()
    out: list[str] = []
    try:
        if ext == "py":
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    out.extend(a.name for a in node.names)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        out.append(node.module)
        elif ext in ("js", "jsx", "ts", "tsx", "mjs", "cjs"):
            out.extend(m.group(1) for m in _RE_JS_IMPORT.finditer(content))
        elif ext == "go":
            for m in _RE_GO_IMPORT.finditer(content):
                blk = m.group(1) or ""
                if blk:
                    for ln in blk.splitlines():
                        ln = ln.strip().strip("_").strip()
                        m2 = re.search(r'"([^"]+)"', ln)
                        if m2:
                            out.append(m2.group(1))
                elif m.group(2):
                    out.append(m.group(2))
        elif ext == "rs":
            for m in _RE_RUST_USE.finditer(content):
                first = m.group(1).split("::")[0].strip()
                if first:
                    out.append(first)
    except Exception:
        pass
    return out


# ---------------------------------------------------------------------------
# 2. Build an architecture graph from the file list + sampled content
# ---------------------------------------------------------------------------
LAYER_HINTS = {
    "frontend": "frontend", "web": "frontend", "ui": "frontend", "client": "frontend",
    "app": "frontend", "apps": "frontend", "components": "frontend", "pages": "frontend",
    "src": "backend",  # src is too generic, leave default backend
    "backend": "backend", "server": "backend", "api": "backend", "services": "backend",
    "internal": "backend", "cmd": "backend", "lib": "backend", "core": "backend",
    "db": "data", "database": "data", "prisma": "data", "migrations": "data",
    "infra": "infra", "deploy": "infra", "docker": "infra", "ops": "infra",
    "test": "tooling", "tests": "tooling", "docs": "frontend", ".github": "tooling",
    "crates": "infra", "packages": "backend", "scripts": "tooling",
}


def top_module(path: str) -> str:
    parts = path.split("/")
    if len(parts) == 1:
        return path  # root file
    return parts[0]


def build_arch_graph(files: list[dict], imports_by_file: dict[str, list[str]]) -> dict:
    """Aggregate file-level imports into a module-level graph.

    Returns: {nodes: [{id,label,sub,layer,x,y}], edges: [[a,b], …]}
    Layout is a simple grid — the SVG renderer expects absolute x/y.
    """
    file_to_top: dict[str, str] = {f["path"]: top_module(f["path"]) for f in files}

    # Map known package-style imports to repository top-level dirs when names match.
    valid_modules = set(file_to_top.values())

    edges: Counter = Counter()
    sizes: Counter = Counter()
    langs: defaultdict[str, Counter] = defaultdict(Counter)

    for f in files:
        top = file_to_top[f["path"]]
        sizes[top] += 1
        lang = f.get("lang") or f["path"].rsplit(".", 1)[-1].lower()
        langs[top][lang] += 1

    for fpath, deps in imports_by_file.items():
        src_top = file_to_top.get(fpath)
        if not src_top:
            continue
        for d in deps:
            # external imports — skip if the head doesn't match a top-level module
            head = (d.split("/")[0]
                      .split(".")[0]
                      .lstrip(".")
                   ) if d else ""
            if not head or head == src_top:
                continue
            if head in valid_modules:
                edges[(src_top, head)] += 1

    # Pick top N modules by file count
    top_modules = [m for m, _ in sizes.most_common(9)]
    nodes_set = set(top_modules)
    edges_filtered = [(a, b) for (a, b), _ in edges.items() if a in nodes_set and b in nodes_set]

    # Grid layout: 3 columns
    nodes = []
    for i, m in enumerate(top_modules):
        col, row = i % 3, i // 3
        x = 60 + col * 240
        y = 40 + row * 140
        common_lang = langs[m].most_common(1)[0][0] if langs[m] else "txt"
        layer = LAYER_HINTS.get(m.lower(), "backend")
        nodes.append({
            "id": m, "label": m, "sub": f"{sizes[m]} files · {common_lang}",
            "layer": layer, "x": x, "y": y,
        })

    return {"nodes": nodes, "edges": edges_filtered}


# ---------------------------------------------------------------------------
# 3. Dependency audit via OSV.dev
# ---------------------------------------------------------------------------
async def audit_dependencies(deps: list[dict]) -> list[dict]:
    """Query OSV.dev for known vulnerabilities.

    deps: list of {ecosystem, name, version}.
    Returns list of {package, version, summary, severity, refs} for each hit.
    OSV.dev is free and requires no API key.
    """
    findings: list[dict] = []
    if not deps:
        return findings
    async with httpx.AsyncClient(timeout=20) as client:
        # POST /v1/querybatch
        queries = [{
            "package": {"ecosystem": d["ecosystem"], "name": d["name"]},
            "version": d.get("version") or "0.0.0",
        } for d in deps]
        try:
            r = await client.post("https://api.osv.dev/v1/querybatch", json={"queries": queries})
            r.raise_for_status()
            results = r.json().get("results", [])
        except Exception:
            return findings

    for d, res in zip(deps, results):
        for v in res.get("vulns", []) or []:
            findings.append({
                "package": d["name"],
                "version": d.get("version") or "—",
                "ecosystem": d["ecosystem"],
                "id": v.get("id"),
                "summary": v.get("summary") or v.get("details", "")[:200],
                "severity": _osv_severity(v),
                "refs": [r.get("url") for r in (v.get("references") or [])][:3],
            })
    return findings


def _osv_severity(vuln: dict) -> str:
    sevs = vuln.get("severity") or []
    score = 0.0
    for s in sevs:
        try:
            score = max(score, float(s.get("score", "0").split("/")[0].split(":")[-1]))
        except Exception:
            pass
    if score >= 9: return "high"
    if score >= 7: return "high"
    if score >= 4: return "medium"
    return "low"


def parse_manifests(files_with_content: list[tuple[str, str]]) -> list[dict]:
    """Parse package.json/requirements.txt/go.mod/Cargo.toml into deps list."""
    out: list[dict] = []
    for path, content in files_with_content:
        name = path.rsplit("/", 1)[-1]
        try:
            if name == "package.json":
                pkg = json.loads(content)
                for k, v in {**pkg.get("dependencies", {}),
                             **pkg.get("devDependencies", {})}.items():
                    out.append({"ecosystem": "npm", "name": k, "version": _clean_ver(v)})
            elif name == "requirements.txt":
                for ln in content.splitlines():
                    ln = ln.strip()
                    if not ln or ln.startswith("#"):
                        continue
                    m = re.match(r"([A-Za-z0-9_\-\.]+)\s*([=<>~!]=?)?\s*([\d\w\.]+)?", ln)
                    if m:
                        out.append({"ecosystem": "PyPI", "name": m.group(1),
                                    "version": m.group(3) or ""})
            elif name == "go.mod":
                in_block = False
                for ln in content.splitlines():
                    s = ln.strip()
                    if s.startswith("require ("):
                        in_block = True; continue
                    if s == ")":
                        in_block = False; continue
                    if in_block or s.startswith("require "):
                        s2 = s.removeprefix("require ").strip()
                        parts = s2.split()
                        if len(parts) >= 2:
                            out.append({"ecosystem": "Go", "name": parts[0],
                                        "version": parts[1]})
            elif name == "Cargo.toml":
                # crude: lines under [dependencies]
                in_dep = False
                for ln in content.splitlines():
                    s = ln.strip()
                    if s.startswith("["):
                        in_dep = s in ("[dependencies]", "[dev-dependencies]")
                        continue
                    if in_dep and "=" in s and not s.startswith("#"):
                        k = s.split("=", 1)[0].strip()
                        v = s.split("=", 1)[1].strip().strip('"\'').strip()
                        if v.startswith("{"):
                            m = re.search(r'version\s*=\s*"([^"]+)"', v)
                            v = m.group(1) if m else ""
                        out.append({"ecosystem": "crates.io", "name": k, "version": v})
        except Exception:
            continue
    # Deduplicate
    seen = set()
    uniq = []
    for d in out:
        key = (d["ecosystem"], d["name"])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(d)
    return uniq


def _clean_ver(v: str) -> str:
    return re.sub(r"^[\^~>=<\s]+", "", str(v or "")).strip()


# ---------------------------------------------------------------------------
# 4. Markdown documentation generator
# ---------------------------------------------------------------------------
def generate_doc_md(session: dict, lang: str = "vi") -> str:
    """Compose a Markdown architecture report from a finished session."""
    repo = session["repo"]
    stats = session.get("stats", {})
    langs = session.get("langs", [])
    fw = session.get("frameworks", [])
    sec = session.get("security", [])
    mods = session.get("modules", [])
    arch = session.get("arch", {})
    dep_findings = session.get("dependencyAudit", [])

    L = (lambda vi, en: vi if lang == "vi" else en)

    lines = [
        f"# {repo['owner']}/{repo['name']}",
        "",
        f"> {repo.get('desc', {}).get(lang, '') or repo.get('desc', {}).get('en', '')}",
        "",
        f"**{L('Nhánh', 'Branch')}:** `{repo.get('branch', 'main')}` · "
        f"**License:** {repo.get('license', '—')} · "
        f"⭐ {repo.get('stars', 0):,} · "
        f"🍴 {repo.get('forks', 0):,}",
        "",
        f"## 1. {L('Tổng quan', 'Overview')}",
        "",
        f"- **{L('Số file', 'Files')}:** {stats.get('files', 0):,}",
        f"- **{L('Dòng code (ước tính)', 'Lines of code (estimate)')}:** {stats.get('loc', 0):,}",
        f"- **{L('Module', 'Modules')}:** {stats.get('modules', 0)}",
        "",
        f"### {L('Ngôn ngữ', 'Languages')}",
        "",
    ]
    for l in langs[:8]:
        lines.append(f"- {l['name']} — {l['pct']}%")

    if fw:
        lines += ["", f"### {L('Framework phát hiện', 'Detected frameworks')}", ""]
        lines += [f"- {f}" for f in fw]

    if mods:
        lines += ["", f"## 2. {L('Module', 'Modules')}", "",
                  "| Name | Files | Risk | Layer |", "|---|---:|:---:|:---|"]
        for m in mods[:20]:
            lines.append(f"| `{m['name']}` | {m['files']} | {m.get('risk', '—')} | {m.get('layer', '—')} |")

    if arch.get("nodes"):
        lines += ["", f"## 3. {L('Sơ đồ kiến trúc', 'Architecture')}", "", "```mermaid", "graph LR"]
        for n in arch["nodes"]:
            lines.append(f"  {n['id']}[\"{n['label']} ({n['sub']})\"]")
        for a, b in arch.get("edges", []):
            lines.append(f"  {a} --> {b}")
        lines.append("```")

    if sec:
        lines += ["", f"## 4. {L('Phát hiện bảo mật', 'Security findings')}", ""]
        for f in sec[:20]:
            t = f.get("title", {}).get(lang) or f.get("rule", "?")
            lines.append(f"- **{f.get('severity', '?').upper()}** — {t} (`{f.get('file')}:{f.get('line')}`)")
    else:
        lines += ["", f"## 4. {L('Phát hiện bảo mật', 'Security findings')}", "",
                  L("Không phát hiện rủi ro nào.", "No findings.")]

    if dep_findings:
        lines += ["", f"## 5. {L('Dependency có CVE', 'Dependency CVEs')}", ""]
        for f in dep_findings[:20]:
            lines.append(f"- **{f['severity'].upper()}** — `{f['package']}@{f['version']}` "
                         f"({f.get('id', '')}): {f.get('summary', '')[:120]}")

    lines += ["", "---",
              L("_Tài liệu sinh tự động bởi AI Codebase Intelligence._",
                "_Auto-generated by AI Codebase Intelligence._")]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# 5. Compare two sessions
# ---------------------------------------------------------------------------
def compare_sessions(a: dict, b: dict) -> dict:
    """Produce {shared, divergence, patternsToBorrow} from two finished sessions."""
    name_a = f"{a['repo']['owner']}/{a['repo']['name']}"
    name_b = f"{b['repo']['owner']}/{b['repo']['name']}"

    deps_a = {d["name"]: d for d in a.get("deps", [])}
    deps_b = {d["name"]: d for d in b.get("deps", [])}
    shared = []
    for n in sorted(set(deps_a) & set(deps_b)):
        shared.append({
            "dep": n, "a": deps_a[n].get("version") or "—",
            "b": deps_b[n].get("version") or "—",
            "risk": "Low",
        })

    fa, fb = set(a.get("frameworks", [])), set(b.get("frameworks", []))
    divergence = []
    for f in sorted(fa - fb):
        divergence.append({"aspect": {"vi": f, "en": f}, "a": "✓", "b": "—"})
    for f in sorted(fb - fa):
        divergence.append({"aspect": {"vi": f, "en": f}, "a": "—", "b": "✓"})

    patterns = []
    a_mods = {m["name"] for m in a.get("modules", [])}
    b_mods = {m["name"] for m in b.get("modules", [])}
    for m in sorted(a_mods - b_mods):
        patterns.append({
            "from": name_a, "to": name_b,
            "what": {"vi": f"Module `{m}` chưa có trong dự án của bạn",
                     "en": f"Module `{m}` is not in your project"},
        })

    return {
        "a": name_a, "b": name_b,
        "shared": shared,
        "divergence": divergence,
        "patternsToBorrow": patterns[:10],
    }
