"""SQLite + SQLAlchemy data layer for the SaaS multi-tenant model."""
from __future__ import annotations

import secrets
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

from sqlalchemy import (
    Integer, String, JSON, ForeignKey, UniqueConstraint, create_engine, text,
)
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker,
)

ROOT = Path(__file__).parent.resolve()
DB_PATH = ROOT / ".cache" / "saas.db"
DB_PATH.parent.mkdir(exist_ok=True)

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    future=True,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def _id() -> str:
    return secrets.token_urlsafe(12)


def _now() -> int:
    return int(time.time())


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, default="")
    password_hash: Mapped[str] = mapped_column(String)
    plan: Mapped[str] = mapped_column(String, default="free")
    default_workspace_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)

    memberships = relationship("WorkspaceMember", back_populates="user",
                               cascade="all,delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user",
                            cascade="all,delete-orphan")


class Workspace(Base):
    __tablename__ = "workspaces"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    plan: Mapped[str] = mapped_column(String, default="free")
    created_at: Mapped[int] = mapped_column(Integer, default=_now)

    members = relationship("WorkspaceMember", back_populates="workspace",
                           cascade="all,delete-orphan")
    scans = relationship("Scan", back_populates="workspace",
                         cascade="all,delete-orphan")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String, default="member")  # owner|admin|member
    created_at: Mapped[int] = mapped_column(Integer, default=_now)

    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="memberships")


class WorkspaceInvite(Base):
    __tablename__ = "workspace_invites"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"))
    email: Mapped[str] = mapped_column(String, index=True)
    role: Mapped[str] = mapped_column(String, default="member")
    token: Mapped[str] = mapped_column(String, unique=True, index=True, default=lambda: secrets.token_urlsafe(24))
    invited_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    accepted_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)


class Scan(Base):
    __tablename__ = "scans"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"), index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    repo_owner: Mapped[str] = mapped_column(String)
    repo_name: Mapped[str] = mapped_column(String)
    visibility: Mapped[str] = mapped_column(String, default="private")  # private|public
    share_token: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True, index=True)
    status: Mapped[str] = mapped_column(String, default="queued")
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)
    finished_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    workspace = relationship("Workspace", back_populates="scans")


class ApiKey(Base):
    __tablename__ = "api_keys"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String, default="default")
    key_hash: Mapped[str] = mapped_column(String, unique=True, index=True)
    prefix: Mapped[str] = mapped_column(String)
    last_used_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)

    user = relationship("User", back_populates="api_keys")


class UsageLog(Base):
    __tablename__ = "usage_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"), index=True)
    action: Mapped[str] = mapped_column(String)   # scan | chat | doc | compare
    units: Mapped[int] = mapped_column(Integer, default=1)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    at: Mapped[int] = mapped_column(Integer, default=_now, index=True)


# Hardcoded plan limits — no Stripe.
PLANS: dict[str, dict] = {
    "free": {
        "label": "Free",
        "price": 0,
        "scansPerMonth": 10,
        "maxRepoKB": 50_000,        # ~50 MB
        "chatPerMonth": 100,
        "members": 1,
        "apiKeys": 1,
        "privateScans": True,
    },
    "pro": {
        "label": "Pro",
        "price": 19,
        "scansPerMonth": 200,
        "maxRepoKB": 500_000,
        "chatPerMonth": 4000,
        "members": 5,
        "apiKeys": 5,
        "privateScans": True,
    },
    "team": {
        "label": "Team",
        "price": 49,
        "scansPerMonth": 2000,
        "maxRepoKB": 2_000_000,
        "chatPerMonth": 40_000,
        "members": 25,
        "apiKeys": 25,
        "privateScans": True,
    },
}


def init_db() -> None:
    Base.metadata.create_all(engine)
    # Light migration: add columns introduced after first deploy.
    with engine.connect() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(scans)"))}
        if "share_token" not in cols:
            conn.execute(text("ALTER TABLE scans ADD COLUMN share_token VARCHAR"))
        conn.commit()


@contextmanager
def session_scope():
    s: Session = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def get_db():
    """FastAPI dependency yielding a SQLAlchemy session."""
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()
