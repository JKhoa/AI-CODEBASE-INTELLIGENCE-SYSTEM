"""
AI Codebase Intelligence — backend.

Reads any public GitHub repository through the GitHub REST API and serves
metadata, file tree, and file contents to the React UI under /static.

Endpoints
---------
POST /api/scan              { url, token? }                -> { id, status, repo, ... }
GET  /api/scan/{id}                                        -> session snapshot
GET  /api/scan/{id}/tree    ?path=&depth=                  -> directory listing (or recursive when depth=full)
GET  /api/scan/{id}/file    ?path=...                      -> { path, content, lang, size, lines }
GET  /api/scan/{id}/readme                                 -> README markdown
GET  /api/library                                          -> all sessions saved on disk
DELETE /api/scan/{id}                                      -> remove session
POST /api/chat              { sessionId, question, kind }  -> grounded answer (heuristic for now)

Requires:  pip install fastapi uvicorn httpx
Run:       python server.py            (listens on :8000)
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
import re
import time
import uuid
from pathlib import Path
from typing import Any, Optional

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import analyze
import llm

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent.resolve()
STORE = ROOT / ".cache"
STORE.mkdir(exist_ok=True)
GITHUB_API = "https://api.github.com"

LANG_BY_EXT = {
    "py": "py", "js": "js", "jsx": "jsx", "ts": "ts", "tsx": "tsx",
    "rs": "rs", "go": "go", "java": "java", "kt": "java",
    "c": "c", "h": "c", "cpp": "c", "cc": "c", "hpp": "c",
    "rb": "rb", "php": "php", "cs": "cs", "swift": "swift",
    "md": "md", "mdx": "md", "json": "json", "yml": "yml", "yaml": "yml",
    "toml": "toml", "html": "html", "css": "css", "scss": "css",
    "sh": "sh", "bash": "sh", "sql": "sql", "txt": "txt",
}
TEXT_LANGS = set(LANG_BY_EXT.values())
SKIP_DIRS = {
    "node_modules", ".git", "dist", "build", ".next", ".venv", "venv",
    "__pycache__", "vendor", "target", ".cache", "coverage",
}

# In-memory session index (mirrored to .cache/<id>.json)
_SESSIONS: dict[str, dict[str, Any]] = {}

# In-memory pre-fetched file chunks per session, used for chat retrieval.
_CHUNK_CACHE: dict[str, list[dict]] = {}

# LLM config: defaults can be overridden by client per request.
LLM_CONFIG = {
    "provider": os.getenv("LLM_PROVIDER", "anthropic"),
    "key":      os.getenv("LLM_API_KEY", ""),
    "model":    os.getenv("LLM_MODEL", ""),
}


def _save(sid: str, data: dict) -> None:
    (STORE / f"{sid}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _load_all() -> None:
    for p in STORE.glob("*.json"):
        try:
            _SESSIONS[p.stem] = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass


_load_all()


# ---------------------------------------------------------------------------
# GitHub helpers
# ---------------------------------------------------------------------------
URL_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/([^/\s]+)/([^/\s#?]+?)(?:\.git)?/?$",
    re.IGNORECASE,
)


def parse_repo_url(url: str) -> tuple[str, str]:
    url = (url or "").strip()
    m = URL_RE.match(url)
    if m:
        return m.group(1), m.group(2)
    # short form "owner/repo"
    if "/" in url and " " not in url:
        owner, _, repo = url.partition("/")
        if owner and repo:
            return owner, repo.split("/")[0]
    raise HTTPException(400, f"Invalid GitHub URL: {url!r}")


def _headers(token: Optional[str]) -> dict[str, str]:
    h = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ai-codebase-intelligence",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


async def _fetch_text(client, owner, repo, branch, token, path) -> str:
    """Fetch a single file's text content via the GitHub contents API. Returns '' on error."""
    try:
        j = await gh_get(client, f"/repos/{owner}/{repo}/contents/{path}", token, ref=branch)
        return base64.b64decode(j.get("content", "")).decode("utf-8", "replace")
    except Exception:
        return ""


async def gh_get(client: httpx.AsyncClient, path: str, token: Optional[str] = None, **params) -> Any:
    r = await client.get(f"{GITHUB_API}{path}", headers=_headers(token), params=params, timeout=30)
    if r.status_code == 404:
        raise HTTPException(404, f"GitHub: not found ({path})")
    if r.status_code == 403 and "rate limit" in r.text.lower():
        raise HTTPException(429, "GitHub rate limit exceeded — provide a token in Settings.")
    if r.status_code >= 400:
        raise HTTPException(r.status_code, f"GitHub error: {r.text[:240]}")
    return r.json()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class ScanRequest(BaseModel):
    url: str
    token: Optional[str] = None


class ChatRequest(BaseModel):
    sessionId: str
    question: str
    kind: Optional[str] = "explain"
    contextScope: Optional[str] = "repo"
    provider: Optional[str] = None    # 'anthropic' | 'openai' | 'ollama'
    apiKey:   Optional[str] = None
    model:    Optional[str] = None


class LLMConfigRequest(BaseModel):
    provider: Optional[str] = None
    apiKey:   Optional[str] = None
    model:    Optional[str] = None


class CompareRequest(BaseModel):
    a: str
    b: str


# ---------------------------------------------------------------------------
# Pipeline (runs in background)
# ---------------------------------------------------------------------------
async def _run_pipeline(sid: str, owner: str, repo: str, token: Optional[str]):
    """Walk the repo via GitHub API and store result on disk progressively."""
    s = _SESSIONS[sid]
    s["status"] = "scanning"
    s["stage"] = "cloning"
    _save(sid, s)

    async with httpx.AsyncClient() as client:
        # 1. metadata
        meta = await gh_get(client, f"/repos/{owner}/{repo}", token)
        s["repo"].update({
            "branch":      meta.get("default_branch", "main"),
            "stars":       meta.get("stargazers_count", 0),
            "forks":       meta.get("forks_count", 0),
            "license":    (meta.get("license") or {}).get("spdx_id") or "—",
            "desc":        {"vi": meta.get("description") or "", "en": meta.get("description") or ""},
            "url":         meta.get("html_url"),
            "size_kb":     meta.get("size", 0),
        })

        # 2. languages
        langs_raw = await gh_get(client, f"/repos/{owner}/{repo}/languages", token)
        total = sum(langs_raw.values()) or 1
        palette = {
            "TypeScript":"#3178C6","JavaScript":"#F7DF1E","Python":"#3776AB",
            "Go":"#00ADD8","Rust":"#DEA584","Java":"#EA8A35","C++":"#00599C",
            "C":"#A8B9CC","C#":"#239120","HTML":"#FB923C","CSS":"#38BDF8",
            "Shell":"#10B981","Ruby":"#CC342D","PHP":"#777BB4","Swift":"#FA7343",
            "Kotlin":"#A97BFF","Vue":"#41B883","Scala":"#DC322F","Dart":"#00B4AB",
            "MDX":"#A78BFA","YAML":"#FB7185","Markdown":"#8C95A8","SQL":"#F472B6",
        }
        s["langs"] = [
            {"name": k, "pct": round(v * 100 / total, 1), "color": palette.get(k, "#5A6273")}
            for k, v in sorted(langs_raw.items(), key=lambda x: -x[1])[:8]
        ]

        s["stage"] = "parsing"
        _save(sid, s)

        # 3. recursive tree
        tree = await gh_get(client, f"/repos/{owner}/{repo}/git/trees/{s['repo']['branch']}",
                            token, recursive="1")
        items: list[dict] = tree.get("tree", [])
        if tree.get("truncated"):
            s["truncated"] = True
        files = [it for it in items if it["type"] == "blob"]
        dirs  = [it for it in items if it["type"] == "tree"]
        s["stats"] = {
            "files": len(files),
            "dirs":  len(dirs),
            "loc":   sum(it.get("size", 0) for it in files) // 50,  # rough chars→lines
            "modules": min(len(dirs), 64),
            "contributors": meta.get("subscribers_count", 0),
            "lastCommit": meta.get("pushed_at", ""),
        }

        # build a tree of {type, name, path, lang, size, children}
        s["tree"] = _make_tree(files, dirs)

        s["stage"] = "indexing"
        _save(sid, s)

        # 4. detect frameworks via package.json / requirements / go.mod
        s["frameworks"] = await _detect_frameworks(client, owner, repo, s["repo"]["branch"], token, files)

        # 5. fetch README markdown (best effort)
        try:
            readme = await gh_get(client, f"/repos/{owner}/{repo}/readme", token)
            s["readme"] = base64.b64decode(readme.get("content", "")).decode("utf-8", "replace")
        except HTTPException:
            s["readme"] = f"# {owner}/{repo}\n\n*(no README detected)*"

        # 6. AST-based import graph for the architecture diagram
        s["stage"] = "summarizing"
        _save(sid, s)

        ast_files = [f for f in files
                     if f["path"].rsplit(".", 1)[-1].lower()
                     in {"py", "js", "jsx", "ts", "tsx", "go", "rs"}
                     and (f.get("size", 0) or 0) < 200_000]
        # Cap at 80 files so we don't burn rate-limit on huge repos
        ast_sample = ast_files[:80]
        imports_by_file: dict[str, list[str]] = {}
        chunks_for_chat: list[dict] = []
        for f in ast_sample:
            txt = await _fetch_text(client, owner, repo, s["repo"]["branch"], token, f["path"])
            if not txt:
                continue
            imports_by_file[f["path"]] = analyze.extract_imports(f["path"], txt)
            chunks_for_chat.append({"path": f["path"], "content": txt[:8000]})
        s["arch"] = analyze.build_arch_graph(files, imports_by_file)
        # cache chunks for the chat layer (kept in-memory only — not persisted)
        _CHUNK_CACHE[sid] = chunks_for_chat

        # 7. dependency manifests + OSV.dev audit
        manifest_paths = [p for p in (
            "package.json", "requirements.txt", "go.mod", "Cargo.toml",
            "pyproject.toml",
        ) if p in {f["path"] for f in files}]
        manifest_pairs: list[tuple[str, str]] = []
        for mp in manifest_paths:
            txt = await _fetch_text(client, owner, repo, s["repo"]["branch"], token, mp)
            if txt:
                manifest_pairs.append((mp, txt))
        s["deps"] = analyze.parse_manifests(manifest_pairs)
        try:
            s["dependencyAudit"] = await analyze.audit_dependencies(s["deps"])
        except Exception:
            s["dependencyAudit"] = []

        # 8. heuristic security scan + LLM confirmation when configured
        s["security"] = await _security_scan(client, owner, repo, s["repo"]["branch"], token, files[:120])
        await _llm_confirm_findings(s)

        # 9. modules summary (top-level dirs)
        s["modules"] = _modules_summary(files, dirs)

        s["stage"] = "ready"
        s["status"] = "ready"
        s["finishedAt"] = int(time.time())
        _save(sid, s)


def _make_tree(files: list[dict], dirs: list[dict]) -> list[dict]:
    """Build a nested tree from a flat GitHub tree listing."""
    root: dict[str, Any] = {"_": {}}
    def insert(path: str, *, kind: str, size: int = 0):
        parts = path.split("/")
        parent = root
        for i, p in enumerate(parts):
            last = i == len(parts) - 1
            children = parent.setdefault("_", {})
            node = children.get(p)
            if not node:
                node = {"name": p, "type": "file" if (last and kind == "blob") else "dir",
                        "path": "/".join(parts[: i + 1]), "_": {}}
                if last and kind == "blob":
                    ext = p.rsplit(".", 1)[-1].lower() if "." in p else ""
                    node["lang"] = LANG_BY_EXT.get(ext, "txt")
                    node["size"] = size
                children[p] = node
            parent = node

    for d in dirs:
        if any(seg in SKIP_DIRS for seg in d["path"].split("/")):
            continue
        insert(d["path"], kind="tree")
    for f in files:
        if any(seg in SKIP_DIRS for seg in f["path"].split("/")):
            continue
        insert(f["path"], kind="blob", size=f.get("size", 0))

    def to_list(children: dict[str, Any]) -> list[dict]:
        out = []
        for name in sorted(children, key=lambda n: (children[n]["type"] != "dir", n.lower())):
            n = children[name]
            entry = {"name": n["name"], "path": n["path"], "type": n["type"]}
            if n["type"] == "dir":
                entry["children"] = to_list(n["_"])
            else:
                entry["lang"] = n.get("lang", "txt")
                entry["size"] = n.get("size", 0)
            out.append(entry)
        return out

    return to_list(root["_"])


async def _detect_frameworks(client, owner, repo, branch, token, files) -> list[str]:
    fw: set[str] = set()
    paths = {f["path"] for f in files}
    async def fetch_text(path: str) -> str:
        try:
            j = await gh_get(client, f"/repos/{owner}/{repo}/contents/{path}", token, ref=branch)
            return base64.b64decode(j.get("content", "")).decode("utf-8", "replace")
        except Exception:
            return ""

    if "package.json" in paths:
        txt = await fetch_text("package.json")
        try:
            pkg = json.loads(txt)
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            mapping = {
                "react": "React", "next": "Next.js", "vue": "Vue", "svelte": "Svelte",
                "express": "Express", "fastify": "Fastify", "@nestjs/core": "NestJS",
                "tailwindcss": "Tailwind", "vite": "Vite", "vitest": "Vitest",
                "jest": "Jest", "playwright": "Playwright", "prisma": "Prisma",
                "typeorm": "TypeORM", "zod": "Zod", "typescript": "TypeScript",
            }
            for k, v in mapping.items():
                if k in deps:
                    fw.add(v)
        except Exception:
            pass
    if any(p == "requirements.txt" or p.endswith("/requirements.txt") for p in paths):
        for cand in ("requirements.txt",):
            txt = await fetch_text(cand)
            for ln in txt.splitlines():
                ln = ln.strip().split("==")[0].split(">=")[0].split("<")[0].lower()
                if ln in {"flask","fastapi","django","tornado","starlette","sanic","pydantic"}:
                    fw.add(ln.capitalize() if ln != "fastapi" else "FastAPI")
                if ln in {"numpy","pandas","torch","tensorflow","scikit-learn"}:
                    fw.add(ln)
    if "go.mod" in paths: fw.add("Go modules")
    if "Cargo.toml" in paths: fw.add("Cargo")
    if "Dockerfile" in paths: fw.add("Docker")
    if any(p.startswith(".github/workflows/") for p in paths): fw.add("GitHub Actions")
    if "pyproject.toml" in paths: fw.add("Poetry/PEP 621")
    return sorted(fw)


async def _security_scan(client, owner, repo, branch, token, files) -> list[dict]:
    """Cheap regex-based scan over a small sample of source files."""
    findings: list[dict] = []
    rules = [
        ("AST.dynamic-eval", re.compile(r"\b(eval|new\s+Function)\s*\("),  "high",
            "Dynamic code execution — high RCE risk", "CWE-95"),
        ("SECRET.entropy",   re.compile(r"['\"](sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,})['\"]"),
            "high", "Hardcoded credential pattern", "CWE-798"),
        ("AST.obfuscation",  re.compile(r"atob\s*\(|base64\.b64decode\s*\("), "medium",
            "Base64 decode → eval pattern", "MITRE T1027"),
        ("SQL.concat",       re.compile(r"(?:SELECT|INSERT|UPDATE|DELETE)[^;]{0,100}\+\s*[a-zA-Z_]"),
            "medium", "SQL string concatenation", "CWE-89"),
        ("NET.suspicious",   re.compile(r"requests\.post|fetch\([^)]*process\.env"), "medium",
            "Possible exfiltration via env vars", "CWE-200"),
    ]
    SAMPLE_EXTS = {".py", ".js", ".jsx", ".ts", ".tsx", ".rb", ".php", ".go", ".java"}
    fid = 1
    for f in files:
        path = f["path"]
        if "test" in path.lower() or "spec" in path.lower():
            continue
        ext = "." + path.rsplit(".", 1)[-1].lower() if "." in path else ""
        if ext not in SAMPLE_EXTS:
            continue
        if (f.get("size", 0) or 0) > 200_000:
            continue
        try:
            j = await gh_get(client, f"/repos/{owner}/{repo}/contents/{path}", token, ref=branch)
            content = base64.b64decode(j.get("content", "")).decode("utf-8", "replace")
        except Exception:
            continue
        lines = content.splitlines()
        for rule_id, pattern, sev, why, ref in rules:
            for i, ln in enumerate(lines, 1):
                if pattern.search(ln):
                    findings.append({
                        "id": f"F-{fid:03d}",
                        "severity": sev,
                        "confirmed": False,
                        "falsePositive": False,
                        "title": {"vi": why, "en": why},
                        "file": path, "line": str(i),
                        "rule": rule_id,
                        "why": {"vi": why, "en": why},
                        "code": "\n".join(lines[max(0, i-2): i+2]),
                        "suggested": "// review and replace with a safer pattern",
                        "refs": [ref],
                    })
                    fid += 1
                    if fid > 30:
                        return findings
                    break  # one hit per rule per file
    return findings


async def _llm_confirm_findings(session: dict) -> None:
    """Layer-2 LLM confirmation for high-severity findings.

    Mutates `session['security']` in place: for each `severity == 'high'` finding
    sets `confirmed = True` or `falsePositive = True`, with a short reason.
    Skipped silently if no LLM key configured.
    """
    cfg = LLM_CONFIG
    if not cfg["key"] and cfg["provider"] != "ollama":
        return
    high = [f for f in session.get("security", []) if f.get("severity") == "high"]
    for f in high[:8]:  # cap calls
        prompt = (
            f"Rule: {f['rule']}\nFile: {f['file']}:{f['line']}\n"
            f"Reason: {f['why'].get('en') or f['why'].get('vi')}\n"
            f"Code:\n```\n{f['code']}\n```\n\n"
            "Is this a real security issue, or a false positive? "
            "Reply with one of: CONFIRMED / FALSE_POSITIVE, then a one-line reason."
        )
        try:
            ans = await llm.llm_chat(
                cfg["provider"], cfg["key"], cfg.get("model"),
                "You are a security reviewer. Be terse and decisive.",
                prompt, max_tokens=120,
            )
        except Exception as e:
            f["llmError"] = str(e)[:120]
            continue
        head = ans.strip().split()[0].upper() if ans else ""
        if head.startswith("FALSE"):
            f["falsePositive"] = True
            f["confirmed"] = False
        elif head.startswith("CONFIRM"):
            f["confirmed"] = True
            f["falsePositive"] = False
        f["llmReason"] = ans[:240]


def _modules_summary(files, dirs) -> list[dict]:
    """Group by top-level directory."""
    by_top: dict[str, dict] = {}
    for f in files:
        top = f["path"].split("/")[0]
        if top in SKIP_DIRS or "." in top and "/" not in f["path"]:
            continue
        m = by_top.setdefault(top, {"name": top, "files": 0, "size": 0, "exts": {}})
        m["files"] += 1
        m["size"]  += f.get("size", 0)
        ext = f["path"].rsplit(".", 1)[-1].lower() if "." in f["path"] else ""
        m["exts"][ext] = m["exts"].get(ext, 0) + 1

    layer_hint = {
        "frontend":"frontend","web":"frontend","ui":"frontend","client":"frontend",
        "app":"frontend","apps":"frontend","components":"frontend","pages":"frontend",
        "backend":"backend","server":"backend","api":"backend","services":"backend",
        "internal":"backend","cmd":"backend",
        "db":"data","database":"data","prisma":"data","migrations":"data",
        "infra":"infra","deploy":"infra","docker":"infra","ops":"infra",
        "test":"tooling","tests":"tooling","docs":"frontend",
    }
    out = []
    for name, m in sorted(by_top.items(), key=lambda kv: -kv[1]["files"])[:20]:
        top_ext = max(m["exts"], key=m["exts"].get) if m["exts"] else "txt"
        risk = "High" if m["files"] > 200 else "Medium" if m["files"] > 50 else "Low"
        out.append({
            "name": name,
            "purpose": {"vi": f"Module thư mục {name}", "en": f"Top-level dir: {name}"},
            "lang": LANG_BY_EXT.get(top_ext, top_ext or "txt"),
            "files": m["files"], "fns": m["files"] * 4,
            "risk": risk,
            "layer": layer_hint.get(name.lower(), "backend"),
        })
    return out


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="AI Codebase Intelligence", version="0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=False,
)


@app.post("/api/scan")
async def create_scan(req: ScanRequest):
    owner, repo = parse_repo_url(req.url)
    sid = f"sess-{owner}-{repo}".lower().replace("_", "-")[:80]
    sid = re.sub(r"[^a-z0-9\-]", "-", sid)
    # New session record
    _SESSIONS[sid] = {
        "id": sid, "status": "queued", "stage": "cloning",
        "repo": {"owner": owner, "name": repo, "url": f"https://github.com/{owner}/{repo}",
                 "branch": "main", "commit": "", "stars": 0, "forks": 0, "license": "—",
                 "desc": {"vi": "", "en": ""}},
        "stats": {"loc": 0, "files": 0, "modules": 0, "contributors": 0, "lastCommit": ""},
        "langs": [], "frameworks": [], "tree": [], "modules": [], "security": [],
        "readme": "", "createdAt": int(time.time()),
        "tokenSet": bool(req.token),
    }
    _save(sid, _SESSIONS[sid])

    async def runner():
        try:
            await _run_pipeline(sid, owner, repo, req.token)
        except HTTPException as e:
            _SESSIONS[sid].update({"status": "failed", "error": e.detail})
            _save(sid, _SESSIONS[sid])
        except Exception as e:  # noqa
            _SESSIONS[sid].update({"status": "failed", "error": repr(e)})
            _save(sid, _SESSIONS[sid])

    asyncio.create_task(runner())
    return _SESSIONS[sid]


@app.get("/api/scan/{sid}")
async def get_scan(sid: str):
    s = _SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, f"Unknown session: {sid}")
    return s


@app.get("/api/scan/{sid}/tree")
async def get_tree(sid: str):
    s = _SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, f"Unknown session: {sid}")
    return {"tree": s.get("tree", [])}


@app.get("/api/scan/{sid}/file")
async def get_file(sid: str, path: str = Query(...)):
    s = _SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, f"Unknown session: {sid}")
    owner, repo = s["repo"]["owner"], s["repo"]["name"]
    branch = s["repo"]["branch"]
    async with httpx.AsyncClient() as client:
        j = await gh_get(client, f"/repos/{owner}/{repo}/contents/{path}", None, ref=branch)
    enc = j.get("encoding")
    raw = base64.b64decode(j.get("content", "")) if enc == "base64" else (j.get("content","").encode())
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return {"path": path, "binary": True, "size": j.get("size", 0)}
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return {
        "path": path, "binary": False, "size": j.get("size", 0),
        "lang": LANG_BY_EXT.get(ext, ext or "txt"),
        "lines": text.count("\n") + 1, "content": text,
    }


@app.get("/api/scan/{sid}/readme")
async def get_readme(sid: str):
    s = _SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, f"Unknown session: {sid}")
    return {"content": s.get("readme", "")}


@app.get("/api/library")
async def list_library():
    out = []
    for sid, s in _SESSIONS.items():
        out.append({
            "id": sid,
            "name": f"{s['repo']['owner']}/{s['repo']['name']}",
            "status": s.get("status", "queued"),
            "stage": s.get("stage", "cloning"),
            "lastScan": s.get("repo", {}).get("lastCommit") or s.get("createdAt", ""),
            "loc": s.get("stats", {}).get("loc", 0),
            "langs": [l["name"][:3].lower() for l in s.get("langs", [])][:4],
            "stars": s.get("repo", {}).get("stars", 0),
            "role": "repo",
        })
    out.sort(key=lambda r: r.get("lastScan") or "", reverse=True)
    return {"items": out}


@app.delete("/api/scan/{sid}")
async def delete_scan(sid: str):
    if sid in _SESSIONS:
        del _SESSIONS[sid]
        p = STORE / f"{sid}.json"
        if p.exists():
            p.unlink()
        return {"ok": True}
    raise HTTPException(404, "unknown session")


# ---- RAG-backed Q&A. Falls back to heuristic when no LLM key is configured. --
@app.post("/api/chat")
async def chat(req: ChatRequest):
    s = _SESSIONS.get(req.sessionId)
    if not s:
        raise HTTPException(404, "unknown session")
    repo_name = f"{s['repo']['owner']}/{s['repo']['name']}"

    # 1. Retrieval over cached chunks (BM25-style scoring).
    chunks = _CHUNK_CACHE.get(req.sessionId, [])
    if not chunks:
        # Cold start (server restart): synthesize chunks from path names so the
        # chat at least returns something pointing to relevant files.
        def walk(nodes):
            for n in nodes:
                if n["type"] == "file":
                    yield n
                else:
                    yield from walk(n.get("children", []))
        chunks = [{"path": f["path"], "content": f["path"].replace("/", " ")}
                  for f in walk(s.get("tree", []))][:300]
    ranked = llm.score_chunks(req.question, chunks)[:6]
    citations = [{"file": c["path"], "range": "1-60"} for c in ranked[:4]]

    # 2. If we have an LLM key, ask the model for a grounded answer.
    provider = req.provider or LLM_CONFIG.get("provider")
    key      = req.apiKey   or LLM_CONFIG.get("key")
    model    = req.model    or LLM_CONFIG.get("model") or None
    use_llm = bool(key) or (provider == "ollama")

    if use_llm and (s.get("status") in ("ready", "scanning")):
        sys = llm.SYSTEM_PROMPT_BASE + f"\nThe repository is `{repo_name}`."
        user_prompt = llm.render_user_prompt(req.question, ranked, req.contextScope or "repo")
        try:
            answer = await llm.llm_chat(provider, key, model, sys, user_prompt, max_tokens=600)
            return {
                "answer": {"vi": answer, "en": answer},
                "citations": citations,
                "scope":     {"vi": "Đã dùng LLM với RAG", "en": "Grounded LLM answer"},
                "model":     model or llm.DEFAULT_MODELS.get(provider, "?"),
                "provider":  provider,
            }
        except Exception as e:
            err = str(e)[:200]
            # fall through to heuristic
            heuristic_note = f" (LLM error: {err})"
    else:
        heuristic_note = ""

    # 3. Heuristic fallback — keeps the UI responsive when no key is configured.
    if req.kind == "audit":
        n_total = len(s.get("security", []))
        n_conf  = sum(1 for f in s.get("security", []) if f.get("confirmed"))
        text = (f"{repo_name}: {n_total} finding ({n_conf} đã xác nhận). "
                f"Mở tab Security để xem chi tiết.{heuristic_note}")
    elif req.kind == "locate":
        if ranked:
            text = ("Có thể bạn đang tìm: "
                    + ", ".join(c["path"] for c in ranked[:3]) + ".")
        else:
            text = "Tôi chưa tìm thấy file nào khớp — thử mô tả chi tiết hơn."
    elif req.kind == "compare":
        text = "Mở `/compare/<a>/<b>` để xem báo cáo so sánh chi tiết."
    else:
        fw = ", ".join(s.get("frameworks", [])[:6]) or "—"
        text = (f"{repo_name}: {s['stats']['files']:,} file, "
                f"{s['stats']['loc']:,} LOC ước lượng, framework: {fw}.{heuristic_note}")

    return {
        "answer":    {"vi": text, "en": text},
        "citations": citations,
        "scope":     {"vi": "Heuristic — chưa có LLM key",
                      "en": "Heuristic — no LLM key configured"},
        "provider":  None,
    }


# ---- LLM config (server-side default; clients can also send keys per-request)
@app.get("/api/llm/config")
async def get_llm_cfg():
    return {"provider": LLM_CONFIG["provider"],
            "model":    LLM_CONFIG.get("model"),
            "hasKey":   bool(LLM_CONFIG.get("key"))}


@app.post("/api/llm/config")
async def set_llm_cfg(req: LLMConfigRequest):
    if req.provider:
        LLM_CONFIG["provider"] = req.provider
    if req.apiKey is not None:
        LLM_CONFIG["key"] = req.apiKey
    if req.model is not None:
        LLM_CONFIG["model"] = req.model
    return {"ok": True, "provider": LLM_CONFIG["provider"],
            "hasKey": bool(LLM_CONFIG.get("key"))}


@app.post("/api/llm/test")
async def test_llm(req: LLMConfigRequest):
    """Ping the configured LLM with a 1-token request to verify the key."""
    try:
        ans = await llm.llm_chat(
            req.provider or LLM_CONFIG["provider"],
            req.apiKey   or LLM_CONFIG["key"],
            req.model    or LLM_CONFIG.get("model"),
            "Reply with the single word OK.",
            "Are you reachable?",
            max_tokens=10,
        )
        return {"ok": True, "answer": ans[:60]}
    except Exception as e:
        return {"ok": False, "error": str(e)[:240]}


# ---- Compare two sessions ---------------------------------------------------
@app.get("/api/compare")
async def compare(a: str, b: str):
    sa, sb = _SESSIONS.get(a), _SESSIONS.get(b)
    if not sa or not sb:
        raise HTTPException(404, "one of the sessions does not exist")
    return analyze.compare_sessions(sa, sb)


# ---- Documentation export ---------------------------------------------------
@app.get("/api/scan/{sid}/doc.md")
async def doc_md(sid: str, lang: str = "vi"):
    s = _SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, "unknown session")
    md = analyze.generate_doc_md(s, lang=lang)
    return JSONResponse(
        {"content": md, "filename": f"{s['repo']['owner']}-{s['repo']['name']}.md"}
    )


# ---- Dependency audit (re-query OSV) ----------------------------------------
@app.get("/api/scan/{sid}/dependencies")
async def deps(sid: str):
    s = _SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, "unknown session")
    return {"deps": s.get("deps", []),
            "audit": s.get("dependencyAudit", [])}


# ---------------------------------------------------------------------------
# Static UI
# ---------------------------------------------------------------------------
app.mount("/src", StaticFiles(directory=str(ROOT / "src")), name="src")


@app.get("/")
async def index():
    return FileResponse(ROOT / "index.html")


@app.get("/{path:path}")
async def spa(path: str):
    # SPA fallback for hash-router; backend routes are prefixed with /api/.
    if path.startswith("api/"):
        return JSONResponse({"detail": "not found"}, status_code=404)
    target = ROOT / path
    if target.is_file():
        return FileResponse(target)
    return FileResponse(ROOT / "index.html")


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
