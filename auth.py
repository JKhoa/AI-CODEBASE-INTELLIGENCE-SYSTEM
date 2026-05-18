"""JWT + password hashing + FastAPI auth dependency."""
from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import time
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from db import ApiKey, User, get_db

APP_SECRET = os.getenv("APP_SECRET", "dev-secret-change-me-in-production")
JWT_ALG = "HS256"
JWT_TTL_SECONDS = 60 * 60 * 24 * 14  # 14 days
PBKDF2_ITER = 200_000

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


# ---------------------------------------------------------------------------
# Password hashing (stdlib pbkdf2 — no external bcrypt dep)
# ---------------------------------------------------------------------------
def hash_password(pw: str) -> str:
    if not pw or len(pw) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, PBKDF2_ITER)
    return f"pbkdf2$sha256${PBKDF2_ITER}${salt.hex()}${dk.hex()}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        algo, hashname, iters, salt_hex, hash_hex = stored.split("$")
    except ValueError:
        return False
    if algo != "pbkdf2":
        return False
    salt = bytes.fromhex(salt_hex)
    dk = hashlib.pbkdf2_hmac(hashname, pw.encode("utf-8"), salt, int(iters))
    return hmac.compare_digest(dk.hex(), hash_hex)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def issue_token(user_id: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {"sub": user_id, "iat": now, "exp": now + JWT_TTL_SECONDS},
        APP_SECRET,
        algorithm=JWT_ALG,
    )


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, APP_SECRET, algorithms=[JWT_ALG])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


# ---------------------------------------------------------------------------
# API keys
# ---------------------------------------------------------------------------
def generate_api_key() -> tuple[str, str, str]:
    """Return (raw_key, prefix_for_display, sha256_hash)."""
    raw = "acb_" + secrets.token_urlsafe(28)
    return raw, raw[:12] + "…", hash_api_key(raw)


def hash_api_key(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
def validate_email(email: str) -> str:
    email = (email or "").strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Invalid email address")
    return email


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def _extract_user_id(
    db: Session,
    authorization: Optional[str],
    x_api_key: Optional[str],
) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        # JWT first
        uid = decode_token(token)
        if uid:
            return uid
        # else: treat as API key
        ak = db.query(ApiKey).filter_by(key_hash=hash_api_key(token)).first()
        if ak:
            ak.last_used_at = int(time.time())
            db.commit()
            return ak.user_id
    if x_api_key:
        ak = db.query(ApiKey).filter_by(key_hash=hash_api_key(x_api_key)).first()
        if ak:
            ak.last_used_at = int(time.time())
            db.commit()
            return ak.user_id
    return None


def current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key"),
) -> User:
    uid = _extract_user_id(db, authorization, x_api_key)
    if not uid:
        raise HTTPException(401, "Not authenticated")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(401, "User not found")
    return user


def optional_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key"),
) -> Optional[User]:
    uid = _extract_user_id(db, authorization, x_api_key)
    if not uid:
        return None
    return db.get(User, uid)
