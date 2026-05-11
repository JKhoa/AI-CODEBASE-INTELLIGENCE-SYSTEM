"""
LLM provider adapters + cheap keyword retrieval for /api/chat.

Three providers are supported through a single async function `llm_chat`:
  - anthropic (claude-*)         — via REST
  - openai    (gpt-*)            — via REST
  - ollama    (any pulled model) — via local REST

Retrieval is intentionally simple (TF-style scoring over file content +
filename) so the project has no extra Python deps beyond httpx.
A real vector DB (Chroma/Qdrant) is the obvious upgrade and only needs to
replace `score_chunks`.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from typing import Iterable, Optional

import httpx


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------
_TOK_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]{2,}")


def tokens(text: str) -> list[str]:
    return [t.lower() for t in _TOK_RE.findall(text or "")]


def score_chunks(question: str, chunks: list[dict]) -> list[dict]:
    """Score chunks {path, content} against a question. Returns top-ranked list.

    Uses log-TF over question terms with a slight boost for path matches.
    Cheap, deterministic, no external service.
    """
    qtoks = set(tokens(question))
    if not qtoks:
        return []
    scored = []
    for ch in chunks:
        ctoks = Counter(tokens(ch.get("content", "")))
        ptoks = set(tokens(ch.get("path", "")))
        sc = 0.0
        for q in qtoks:
            if q in ctoks:
                sc += 1 + math.log(1 + ctoks[q])
            if q in ptoks:
                sc += 2.5
        if sc:
            scored.append({**ch, "_score": round(sc, 3)})
    scored.sort(key=lambda c: -c["_score"])
    return scored


def make_chunks(files: Iterable[dict], get_content) -> list[dict]:
    """Pre-fetch content for chat-friendly chunking.

    files: iterable of {path, size}.
    get_content: async callable path -> str (may raise; skip on failure).
    Caller decides how many to pre-fetch.
    """
    raise NotImplementedError("Use the async helper in server.py")


def truncate_content(text: str, max_lines: int = 80) -> str:
    lines = text.splitlines()
    if len(lines) <= max_lines:
        return text
    return "\n".join(lines[:max_lines]) + f"\n# ... ({len(lines) - max_lines} more lines)"


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------
DEFAULT_MODELS = {
    "anthropic": "claude-haiku-4-5-20251001",
    "openai":    "gpt-4o-mini",
    "ollama":    "llama3.1:8b",
}


async def llm_chat(provider: str, key: Optional[str], model: Optional[str],
                   system: str, user: str, max_tokens: int = 800,
                   ollama_host: str = "http://localhost:11434") -> str:
    """Send a one-shot chat request and return the assistant text.

    Raises httpx.HTTPError on transport failure; raises ValueError on bad config.
    """
    provider = (provider or "anthropic").lower()
    model = model or DEFAULT_MODELS.get(provider)

    async with httpx.AsyncClient(timeout=60) as client:
        if provider == "anthropic":
            if not key:
                raise ValueError("Anthropic API key missing")
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": max_tokens,
                    "system": system,
                    "messages": [{"role": "user", "content": user}],
                },
            )
            r.raise_for_status()
            data = r.json()
            return "".join(p.get("text", "") for p in data.get("content", [])).strip()

        if provider == "openai":
            if not key:
                raise ValueError("OpenAI API key missing")
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "max_tokens": max_tokens,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"].strip()

        if provider == "ollama":
            r = await client.post(
                f"{ollama_host}/api/chat",
                json={
                    "model": model,
                    "stream": False,
                    "options": {"num_predict": max_tokens},
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            r.raise_for_status()
            data = r.json()
            return data.get("message", {}).get("content", "").strip()

        raise ValueError(f"Unknown LLM provider: {provider!r}")


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_BASE = """You are an AI codebase assistant. You answer questions about a specific GitHub
repository the user has indexed. Rules:

1. Stay grounded — quote file paths and line ranges from the provided context.
2. If the answer is not in the context, say so honestly. Don't fabricate.
3. Be concise: 2–4 short paragraphs unless the user asked for detail.
4. Reply in the language the user wrote in (Vietnamese or English).
5. Use Markdown: backticks for code/identifiers, **bold** for the punch line.

Context format: each chunk starts with `--- path:line ---` then the file body.
"""


def render_user_prompt(question: str, chunks: list[dict], scope: str = "repo") -> str:
    parts = []
    if chunks:
        parts.append("Code context (top matches):\n")
        for ch in chunks[:6]:
            path = ch.get("path", "?")
            body = truncate_content(ch.get("content", ""), 60)
            parts.append(f"--- {path} ---\n{body}\n")
    else:
        parts.append("(No specific file matched — answer from general structure.)\n")
    if scope == "compare":
        parts.append("\nThe user has asked you to relate this repo to their own project.")
    parts.append(f"\nUser question: {question}\n")
    return "\n".join(parts)
