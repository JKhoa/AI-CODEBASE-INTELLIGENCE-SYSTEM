"""
AI Codebase Intelligence — SaaS backend.

Multi-tenant FastAPI server with:
- email/password auth (JWT, 14-day TTL) + per-user API keys
- workspaces (one per user by default, invitable team members)
- per-workspace scan storage in SQLite (replaces the old .cache/*.json files)
- plan-based quotas (free / pro / team), no Stripe — limits enforced server-side
- public share links for scans
- the original GitHub indexing pipeline, untouched

Run: python server.py        (listens on :8000)
"""
from __future__ import annotations

import asyncio
import base64
import json
import re
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

import analyze
import llm
from auth import (
    current_user, generate_api_key, hash_api_key, hash_password, issue_token,
    optional_user, validate_email, verify_password,
)
from db import (
    ApiKey, PLANS, Scan, SessionLocal, UsageLog, User, Workspace,
    WorkspaceInvite, WorkspaceMember, get_db, init_db,
)

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent.resolve()
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
SKIP_DIRS = {
    "node_modules", ".git", "dist", "build", ".next", ".venv", "venv",
    "__pycache__", "vendor", "target", ".cache", "coverage",
}

# In-memory cache of full scan data (mirrored to DB) — re-hydrated at startup.
_SESSIONS: dict[str, dict[str, Any]] = {}
# In-memory pre-fetched file chunks per session (not persisted).
_CHUNK_CACHE: dict[str, list[dict]] = {}

LLM_CONFIG = {
    "provider": os.getenv("LLM_PROVIDER", "anthropic"),
    "key":      os.getenv("LLM_API_KEY", ""),
    "model":    os.getenv("LLM_MODEL", ""),
}


# ---------------------------------------------------------------------------
# DB-backed session persistence
# ---------------------------------------------------------------------------
def _save(sid: str, data: dict) -> None:
    """Upsert the in-memory session blob into the scans table."""
    with SessionLocal() as db:
        row = db.get(Scan, sid)
        if not row:
            return
        row.status = data.get("status", row.status)
        row.data = data
        if data.get("finishedAt"):
            row.finished_at = int(data["finishedAt"])
        db.add(row)
        db.commit()


def _load_all() -> None:
    init_db()
    with SessionLocal() as db:
        for row in db.query(Scan).all():
            _SESSIONS[row.id] = row.data or {}


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
# Models (request/response)
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class ScanRequest(BaseModel):
    url: str
    token: Optional[str] = None
    workspaceId: Optional[str] = None


class ChatRequest(BaseModel):
    sessionId: str
    question: str
    kind: Optional[str] = "explain"
    contextScope: Optional[str] = "repo"
    provider: Optional[str] = None
    apiKey:   Optional[str] = None
    model:    Optional[str] = None


class LLMConfigRequest(BaseModel):
    provider: Optional[str] = None
    apiKey:   Optional[str] = None
    model:    Optional[str] = None


class ApiKeyRequest(BaseModel):
    name: Optional[str] = "default"


class InviteRequest(BaseModel):
    email: str
    role: Optional[str] = "member"


class AcceptInviteRequest(BaseModel):
    token: str


class UpdatePlanRequest(BaseModel):
    plan: str    # free | pro | team


class ShareRequest(BaseModel):
    visibility: Optional[str] = None   # public | private


# ---------------------------------------------------------------------------
# Pipeline (unchanged from original — operates on the in-memory dict and
# persists via _save())
# ---------------------------------------------------------------------------
async def _run_pipeline(sid: str, owner: str, repo: str, token: Optional[str]):
    s = _SESSIONS[sid]
    s["status"] = "scanning"
    s["stage"] = "cloning"
    _save(sid, s)

    async with httpx.AsyncClient() as client:
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
            "loc":   sum(it.get("size", 0) for it in files) // 50,
            "modules": min(len(dirs), 64),
            "contributors": meta.get("subscribers_count", 0),
            "lastCommit": meta.get("pushed_at", ""),
        }
        s["tree"] = _make_tree(files, dirs)

        s["stage"] = "indexing"
        _save(sid, s)

        s["frameworks"] = await _detect_frameworks(client, owner, repo, s["repo"]["branch"], token, files)

        try:
            readme = await gh_get(client, f"/repos/{owner}/{repo}/readme", token)
            s["readme"] = base64.b64decode(readme.get("content", "")).decode("utf-8", "replace")
        except HTTPException:
            s["readme"] = f"# {owner}/{repo}\n\n*(no README detected)*"

        s["stage"] = "summarizing"
        _save(sid, s)

        ast_files = [f for f in files
                     if f["path"].rsplit(".", 1)[-1].lower()
                     in {"py", "js", "jsx", "ts", "tsx", "go", "rs"}
                     and (f.get("size", 0) or 0) < 200_000]
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
        _CHUNK_CACHE[sid] = chunks_for_chat

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

        s["security"] = await _security_scan(client, owner, repo, s["repo"]["branch"], token, files[:120])
        await _llm_confirm_findings(s)

        s["modules"] = _modules_summary(files, dirs)

        s["stage"] = "ready"
        s["status"] = "ready"
        s["finishedAt"] = int(time.time())
        _save(sid, s)


def _make_tree(files: list[dict], dirs: list[dict]) -> list[dict]:
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
                    break
    return findings


async def _llm_confirm_findings(session: dict) -> None:
    cfg = LLM_CONFIG
    if not cfg["key"] and cfg["provider"] != "ollama":
        return
    high = [f for f in session.get("security", []) if f.get("severity") == "high"]
    for f in high[:8]:
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
# Multi-tenant helpers
# ---------------------------------------------------------------------------
def _slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.strip().lower()).strip("-")
    return s or "ws"


def _ensure_default_workspace(db: Session, user: User) -> Workspace:
    if user.default_workspace_id:
        ws = db.get(Workspace, user.default_workspace_id)
        if ws:
            return ws
    base = _slugify(user.email.split("@")[0])
    slug = base
    i = 2
    while db.query(Workspace).filter_by(slug=slug).first():
        slug = f"{base}-{i}"
        i += 1
    ws = Workspace(name=f"{user.name or user.email.split('@')[0]}'s workspace",
                   slug=slug, owner_id=user.id, plan=user.plan)
    db.add(ws); db.flush()
    db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="owner"))
    user.default_workspace_id = ws.id
    db.commit()
    return ws


def _user_workspaces(db: Session, user: User) -> list[Workspace]:
    ids = [m.workspace_id for m in db.query(WorkspaceMember).filter_by(user_id=user.id).all()]
    if not ids:
        return []
    return db.query(Workspace).filter(Workspace.id.in_(ids)).all()


def _require_workspace_access(db: Session, user: User, workspace_id: str, role: Optional[str] = None) -> WorkspaceMember:
    m = db.query(WorkspaceMember).filter_by(workspace_id=workspace_id, user_id=user.id).first()
    if not m:
        raise HTTPException(403, "No access to this workspace")
    if role == "owner" and m.role != "owner":
        raise HTTPException(403, "Owner role required")
    if role == "admin" and m.role not in ("owner", "admin"):
        raise HTTPException(403, "Admin role required")
    return m


def _resolve_workspace(db: Session, user: User, workspace_id: Optional[str]) -> Workspace:
    if workspace_id:
        _require_workspace_access(db, user, workspace_id)
        ws = db.get(Workspace, workspace_id)
        if not ws:
            raise HTTPException(404, "Workspace not found")
        return ws
    return _ensure_default_workspace(db, user)


def _month_start_ts() -> int:
    now = datetime.now(timezone.utc)
    first = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return int(first.timestamp())


def _usage_this_month(db: Session, workspace_id: str, action: str) -> int:
    q = db.query(func.coalesce(func.sum(UsageLog.units), 0)).filter(
        UsageLog.workspace_id == workspace_id,
        UsageLog.action == action,
        UsageLog.at >= _month_start_ts(),
    )
    return int(q.scalar() or 0)


def _log_usage(db: Session, user: User, ws: Workspace, action: str, units: int = 1, meta: Optional[dict] = None) -> None:
    db.add(UsageLog(user_id=user.id, workspace_id=ws.id, action=action, units=units, meta=meta or {}))
    db.commit()


def _check_quota(db: Session, ws: Workspace, action: str) -> None:
    limits = PLANS.get(ws.plan, PLANS["free"])
    key = {"scan": "scansPerMonth", "chat": "chatPerMonth"}.get(action)
    if not key:
        return
    used = _usage_this_month(db, ws.id, action)
    cap = limits[key]
    if used >= cap:
        raise HTTPException(
            402,
            f"Quota exceeded: {action} ({used}/{cap} this month, plan={ws.plan}). "
            "Upgrade plan in Settings → Billing.",
        )


def _scan_row(db: Session, sid: str) -> Optional[Scan]:
    return db.get(Scan, sid)


def _scan_view(row: Scan, data: dict) -> dict:
    d = dict(data or {})
    d.update({
        "id": row.id, "workspaceId": row.workspace_id, "userId": row.user_id,
        "visibility": row.visibility, "shareToken": row.share_token,
    })
    return d


def _can_read_scan(db: Session, user: Optional[User], row: Scan, share_token: Optional[str] = None) -> bool:
    if row.visibility == "public":
        return True
    if share_token and share_token == row.share_token:
        return True
    if not user:
        return False
    m = db.query(WorkspaceMember).filter_by(workspace_id=row.workspace_id, user_id=user.id).first()
    return m is not None


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="AI Codebase Intelligence", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=False,
)


# ---- Auth -------------------------------------------------------------------
@app.post("/api/auth/signup")
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    email = validate_email(req.email)
    if db.query(User).filter_by(email=email).first():
        raise HTTPException(409, "Email already registered")
    user = User(email=email, name=(req.name or "").strip(), password_hash=hash_password(req.password))
    db.add(user); db.flush()
    ws = _ensure_default_workspace(db, user)
    db.commit()
    return {
        "token": issue_token(user.id),
        "user":  {"id": user.id, "email": user.email, "name": user.name, "plan": user.plan},
        "workspace": {"id": ws.id, "name": ws.name, "slug": ws.slug, "plan": ws.plan, "role": "owner"},
    }


@app.post("/api/auth/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = validate_email(req.email)
    user = db.query(User).filter_by(email=email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    ws = _ensure_default_workspace(db, user)
    return {
        "token": issue_token(user.id),
        "user":  {"id": user.id, "email": user.email, "name": user.name, "plan": user.plan},
        "workspace": {"id": ws.id, "name": ws.name, "slug": ws.slug, "plan": ws.plan, "role": "owner"},
    }


@app.get("/api/auth/me")
async def me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    ws = _ensure_default_workspace(db, user)
    workspaces = []
    for m in db.query(WorkspaceMember).filter_by(user_id=user.id).all():
        w = db.get(Workspace, m.workspace_id)
        if w:
            workspaces.append({"id": w.id, "name": w.name, "slug": w.slug,
                               "plan": w.plan, "role": m.role})
    return {
        "user": {"id": user.id, "email": user.email, "name": user.name, "plan": user.plan},
        "defaultWorkspaceId": ws.id,
        "workspaces": workspaces,
    }


@app.post("/api/auth/plan")
async def update_plan(req: UpdatePlanRequest,
                      user: User = Depends(current_user),
                      db: Session = Depends(get_db)):
    if req.plan not in PLANS:
        raise HTTPException(400, "Unknown plan")
    user.plan = req.plan
    # propagate to owned workspaces
    for ws in db.query(Workspace).filter_by(owner_id=user.id).all():
        ws.plan = req.plan
    db.commit()
    return {"ok": True, "plan": user.plan}


# ---- Dashboard / billing info ----------------------------------------------
@app.get("/api/dashboard")
async def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)):
    ws = _ensure_default_workspace(db, user)
    n_scans = db.query(Scan).filter_by(workspace_id=ws.id).count()
    used_scans = _usage_this_month(db, ws.id, "scan")
    used_chat  = _usage_this_month(db, ws.id, "chat")
    member_count = db.query(WorkspaceMember).filter_by(workspace_id=ws.id).count()
    api_key_count = db.query(ApiKey).filter_by(workspace_id=ws.id).count()
    limits = PLANS[ws.plan]
    return {
        "user": {"id": user.id, "email": user.email, "name": user.name, "plan": user.plan},
        "workspace": {"id": ws.id, "name": ws.name, "slug": ws.slug, "plan": ws.plan},
        "limits": limits,
        "usage": {
            "scansThisMonth": used_scans,
            "chatThisMonth":  used_chat,
            "totalScans":     n_scans,
            "members":        member_count,
            "apiKeys":        api_key_count,
        },
        "plans": PLANS,
    }


@app.get("/api/plans")
async def list_plans():
    return {"plans": PLANS}


# ---- Workspaces / team ------------------------------------------------------
@app.get("/api/workspaces")
async def list_workspaces(user: User = Depends(current_user), db: Session = Depends(get_db)):
    out = []
    for m in db.query(WorkspaceMember).filter_by(user_id=user.id).all():
        w = db.get(Workspace, m.workspace_id)
        if w:
            out.append({"id": w.id, "name": w.name, "slug": w.slug, "plan": w.plan, "role": m.role})
    return {"items": out}


@app.get("/api/workspaces/{wid}/members")
async def list_members(wid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    _require_workspace_access(db, user, wid)
    out = []
    for m in db.query(WorkspaceMember).filter_by(workspace_id=wid).all():
        u = db.get(User, m.user_id)
        if u:
            out.append({"id": m.id, "userId": u.id, "email": u.email, "name": u.name, "role": m.role,
                        "joinedAt": m.created_at})
    pending = []
    for inv in db.query(WorkspaceInvite).filter_by(workspace_id=wid, accepted_at=None).all():
        pending.append({"id": inv.id, "email": inv.email, "role": inv.role, "token": inv.token,
                        "createdAt": inv.created_at})
    return {"members": out, "invites": pending}


@app.post("/api/workspaces/{wid}/invite")
async def invite_member(wid: str, req: InviteRequest,
                        user: User = Depends(current_user), db: Session = Depends(get_db)):
    _require_workspace_access(db, user, wid, role="admin")
    ws = db.get(Workspace, wid)
    limits = PLANS.get(ws.plan, PLANS["free"])
    current_count = db.query(WorkspaceMember).filter_by(workspace_id=wid).count()
    pending = db.query(WorkspaceInvite).filter_by(workspace_id=wid, accepted_at=None).count()
    if current_count + pending >= limits["members"]:
        raise HTTPException(402, f"Member cap reached ({limits['members']} for plan {ws.plan}). Upgrade to invite more.")
    email = validate_email(req.email)
    inv = WorkspaceInvite(workspace_id=wid, email=email,
                          role=req.role if req.role in ("admin", "member") else "member",
                          invited_by=user.id)
    db.add(inv); db.commit()
    return {"id": inv.id, "token": inv.token, "email": inv.email, "role": inv.role}


@app.post("/api/invites/accept")
async def accept_invite(req: AcceptInviteRequest,
                        user: User = Depends(current_user), db: Session = Depends(get_db)):
    inv = db.query(WorkspaceInvite).filter_by(token=req.token, accepted_at=None).first()
    if not inv:
        raise HTTPException(404, "Invalid or expired invite")
    if inv.email.lower() != user.email.lower():
        raise HTTPException(403, "Invite is for a different email")
    if db.query(WorkspaceMember).filter_by(workspace_id=inv.workspace_id, user_id=user.id).first():
        inv.accepted_at = int(time.time()); db.commit()
        return {"ok": True, "workspaceId": inv.workspace_id}
    db.add(WorkspaceMember(workspace_id=inv.workspace_id, user_id=user.id, role=inv.role))
    inv.accepted_at = int(time.time())
    db.commit()
    return {"ok": True, "workspaceId": inv.workspace_id}


@app.delete("/api/workspaces/{wid}/members/{member_id}")
async def remove_member(wid: str, member_id: str,
                        user: User = Depends(current_user), db: Session = Depends(get_db)):
    _require_workspace_access(db, user, wid, role="admin")
    m = db.get(WorkspaceMember, member_id)
    if not m or m.workspace_id != wid:
        raise HTTPException(404, "Member not found")
    if m.role == "owner":
        raise HTTPException(400, "Cannot remove the workspace owner")
    db.delete(m); db.commit()
    return {"ok": True}


# ---- API keys ---------------------------------------------------------------
@app.get("/api/api-keys")
async def list_api_keys(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(ApiKey).filter_by(user_id=user.id).order_by(desc(ApiKey.created_at)).all()
    return {"items": [{"id": r.id, "name": r.name, "prefix": r.prefix,
                       "lastUsedAt": r.last_used_at, "createdAt": r.created_at} for r in rows]}


@app.post("/api/api-keys")
async def create_api_key(req: ApiKeyRequest,
                         user: User = Depends(current_user), db: Session = Depends(get_db)):
    ws = _ensure_default_workspace(db, user)
    limits = PLANS.get(user.plan, PLANS["free"])
    count = db.query(ApiKey).filter_by(user_id=user.id).count()
    if count >= limits["apiKeys"]:
        raise HTTPException(402, f"API key cap reached ({limits['apiKeys']} for plan {user.plan}). Upgrade to create more.")
    raw, prefix, h = generate_api_key()
    row = ApiKey(user_id=user.id, workspace_id=ws.id, name=req.name or "default",
                 key_hash=h, prefix=prefix)
    db.add(row); db.commit()
    return {"id": row.id, "name": row.name, "key": raw, "prefix": prefix}


@app.delete("/api/api-keys/{key_id}")
async def delete_api_key(key_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = db.get(ApiKey, key_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, "API key not found")
    db.delete(row); db.commit()
    return {"ok": True}


# ---- Scans (multi-tenant) ---------------------------------------------------
def _make_scan_id(ws: Workspace, owner: str, repo: str) -> str:
    sid = f"sess-{ws.id[:6]}-{owner}-{repo}".lower().replace("_", "-")[:80]
    return re.sub(r"[^a-z0-9\-]", "-", sid)


@app.post("/api/scan")
async def create_scan(req: ScanRequest,
                      user: User = Depends(current_user), db: Session = Depends(get_db)):
    ws = _resolve_workspace(db, user, req.workspaceId)
    _check_quota(db, ws, "scan")

    owner, repo = parse_repo_url(req.url)
    sid = _make_scan_id(ws, owner, repo)

    # Upsert scan row
    row = db.get(Scan, sid)
    if not row:
        row = Scan(id=sid, workspace_id=ws.id, user_id=user.id,
                   repo_owner=owner, repo_name=repo, status="queued", data={})
        db.add(row)
    else:
        row.user_id = user.id
        row.status = "queued"
    db.commit()

    initial = {
        "id": sid, "status": "queued", "stage": "cloning",
        "repo": {"owner": owner, "name": repo, "url": f"https://github.com/{owner}/{repo}",
                 "branch": "main", "commit": "", "stars": 0, "forks": 0, "license": "—",
                 "desc": {"vi": "", "en": ""}},
        "stats": {"loc": 0, "files": 0, "modules": 0, "contributors": 0, "lastCommit": ""},
        "langs": [], "frameworks": [], "tree": [], "modules": [], "security": [],
        "readme": "", "createdAt": int(time.time()),
        "tokenSet": bool(req.token),
        "workspaceId": ws.id, "userId": user.id, "visibility": row.visibility,
    }
    _SESSIONS[sid] = initial
    _save(sid, initial)
    _log_usage(db, user, ws, "scan", 1, {"owner": owner, "repo": repo})

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
    return initial


@app.get("/api/scan/{sid}")
async def get_scan(sid: str, share: Optional[str] = None,
                   user: Optional[User] = Depends(optional_user),
                   db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, f"Unknown session: {sid}")
    if not _can_read_scan(db, user, row, share):
        raise HTTPException(403, "No access to this scan")
    data = _SESSIONS.get(sid) or row.data or {}
    return _scan_view(row, data)


@app.get("/api/scan/{sid}/tree")
async def get_tree(sid: str, share: Optional[str] = None,
                   user: Optional[User] = Depends(optional_user),
                   db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, f"Unknown session: {sid}")
    if not _can_read_scan(db, user, row, share):
        raise HTTPException(403, "No access")
    data = _SESSIONS.get(sid) or row.data or {}
    return {"tree": data.get("tree", [])}


@app.get("/api/scan/{sid}/file")
async def get_file(sid: str, path: str = Query(...), share: Optional[str] = None,
                   user: Optional[User] = Depends(optional_user),
                   db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, f"Unknown session: {sid}")
    if not _can_read_scan(db, user, row, share):
        raise HTTPException(403, "No access")
    data = _SESSIONS.get(sid) or row.data or {}
    owner, repo = data["repo"]["owner"], data["repo"]["name"]
    branch = data["repo"]["branch"]
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
async def get_readme(sid: str, share: Optional[str] = None,
                     user: Optional[User] = Depends(optional_user),
                     db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, f"Unknown session: {sid}")
    if not _can_read_scan(db, user, row, share):
        raise HTTPException(403, "No access")
    data = _SESSIONS.get(sid) or row.data or {}
    return {"content": data.get("readme", "")}


@app.post("/api/scan/{sid}/share")
async def share_scan(sid: str, req: ShareRequest,
                     user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, "Unknown scan")
    _require_workspace_access(db, user, row.workspace_id)
    if req.visibility in ("public", "private"):
        row.visibility = req.visibility
    if row.visibility == "public" and not row.share_token:
        import secrets as _s
        row.share_token = _s.token_urlsafe(18)
    db.commit()
    return {"id": row.id, "visibility": row.visibility, "shareToken": row.share_token}


@app.get("/api/library")
async def list_library(user: User = Depends(current_user), db: Session = Depends(get_db)):
    ws_ids = [m.workspace_id for m in db.query(WorkspaceMember).filter_by(user_id=user.id).all()]
    if not ws_ids:
        return {"items": []}
    rows = (db.query(Scan).filter(Scan.workspace_id.in_(ws_ids))
              .order_by(desc(Scan.created_at)).all())
    out = []
    for r in rows:
        d = r.data or {}
        out.append({
            "id": r.id,
            "name": f"{r.repo_owner}/{r.repo_name}",
            "status": d.get("status", r.status),
            "stage": d.get("stage", "cloning"),
            "lastScan": d.get("repo", {}).get("lastCommit") or r.created_at,
            "loc": d.get("stats", {}).get("loc", 0),
            "langs": [l["name"][:3].lower() for l in d.get("langs", [])][:4],
            "stars": d.get("repo", {}).get("stars", 0),
            "role": "repo",
            "workspaceId": r.workspace_id,
            "visibility": r.visibility,
        })
    return {"items": out}


@app.delete("/api/scan/{sid}")
async def delete_scan(sid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, "unknown session")
    _require_workspace_access(db, user, row.workspace_id)
    db.delete(row); db.commit()
    _SESSIONS.pop(sid, None)
    _CHUNK_CACHE.pop(sid, None)
    return {"ok": True}


# ---- Chat (RAG + LLM) -------------------------------------------------------
@app.post("/api/chat")
async def chat(req: ChatRequest,
               user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = _scan_row(db, req.sessionId)
    if not row:
        raise HTTPException(404, "unknown session")
    if not _can_read_scan(db, user, row):
        raise HTTPException(403, "No access")
    ws = db.get(Workspace, row.workspace_id)
    _check_quota(db, ws, "chat")
    s = _SESSIONS.get(req.sessionId) or row.data or {}
    repo_name = f"{s['repo']['owner']}/{s['repo']['name']}"

    chunks = _CHUNK_CACHE.get(req.sessionId, [])
    if not chunks:
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

    provider = req.provider or LLM_CONFIG.get("provider")
    key      = req.apiKey   or LLM_CONFIG.get("key")
    model    = req.model    or LLM_CONFIG.get("model") or None
    use_llm = bool(key) or (provider == "ollama")

    if use_llm and (s.get("status") in ("ready", "scanning")):
        sys = llm.SYSTEM_PROMPT_BASE + f"\nThe repository is `{repo_name}`."
        user_prompt = llm.render_user_prompt(req.question, ranked, req.contextScope or "repo")
        try:
            answer = await llm.llm_chat(provider, key, model, sys, user_prompt, max_tokens=600)
            _log_usage(db, user, ws, "chat", 1, {"sid": req.sessionId})
            return {
                "answer": {"vi": answer, "en": answer},
                "citations": citations,
                "scope":     {"vi": "Đã dùng LLM với RAG", "en": "Grounded LLM answer"},
                "model":     model or llm.DEFAULT_MODELS.get(provider, "?"),
                "provider":  provider,
            }
        except Exception as e:
            err = str(e)[:200]
            heuristic_note = f" (LLM error: {err})"
    else:
        heuristic_note = ""

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
    _log_usage(db, user, ws, "chat", 1, {"sid": req.sessionId, "heuristic": True})
    return {
        "answer":    {"vi": text, "en": text},
        "citations": citations,
        "scope":     {"vi": "Heuristic — chưa có LLM key",
                      "en": "Heuristic — no LLM key configured"},
        "provider":  None,
    }


# ---- LLM config -------------------------------------------------------------
@app.get("/api/llm/config")
async def get_llm_cfg():
    return {"provider": LLM_CONFIG["provider"],
            "model":    LLM_CONFIG.get("model"),
            "hasKey":   bool(LLM_CONFIG.get("key"))}


@app.post("/api/llm/config")
async def set_llm_cfg(req: LLMConfigRequest, user: User = Depends(current_user)):
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
async def compare(a: str, b: str,
                  user: User = Depends(current_user), db: Session = Depends(get_db)):
    ra, rb = _scan_row(db, a), _scan_row(db, b)
    if not ra or not rb:
        raise HTTPException(404, "one of the sessions does not exist")
    if not _can_read_scan(db, user, ra) or not _can_read_scan(db, user, rb):
        raise HTTPException(403, "No access to one or both scans")
    sa = _SESSIONS.get(a) or ra.data
    sb = _SESSIONS.get(b) or rb.data
    return analyze.compare_sessions(sa, sb)


# ---- Documentation export ---------------------------------------------------
@app.get("/api/scan/{sid}/doc.md")
async def doc_md(sid: str, lang: str = "vi", share: Optional[str] = None,
                 user: Optional[User] = Depends(optional_user),
                 db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, "unknown session")
    if not _can_read_scan(db, user, row, share):
        raise HTTPException(403, "No access")
    data = _SESSIONS.get(sid) or row.data
    md = analyze.generate_doc_md(data, lang=lang)
    return JSONResponse(
        {"content": md, "filename": f"{row.repo_owner}-{row.repo_name}.md"}
    )


# ---- Dependency audit -------------------------------------------------------
@app.get("/api/scan/{sid}/dependencies")
async def deps(sid: str, share: Optional[str] = None,
               user: Optional[User] = Depends(optional_user),
               db: Session = Depends(get_db)):
    row = _scan_row(db, sid)
    if not row:
        raise HTTPException(404, "unknown session")
    if not _can_read_scan(db, user, row, share):
        raise HTTPException(403, "No access")
    data = _SESSIONS.get(sid) or row.data
    return {"deps": data.get("deps", []), "audit": data.get("dependencyAudit", [])}


# ---- Health ----------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"ok": True, "version": "1.0", "now": int(time.time())}


# ---------------------------------------------------------------------------
# Static UI (legacy CDN-only fallback)
# ---------------------------------------------------------------------------
app.mount("/src", StaticFiles(directory=str(ROOT / "src")), name="src")


@app.get("/")
async def index():
    return FileResponse(ROOT / "index.html")


@app.get("/{path:path}")
async def spa(path: str):
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
