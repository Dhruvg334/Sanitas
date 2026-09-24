"""Database session lifecycle and engine management with explicit failure boundaries."""

import os
from typing import Generator
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.errors import AnalysisError, ErrorCode

_engine: Engine | None = None
_session_maker = None


def get_engine() -> Engine:
    global _engine
    if _engine is not None:
        return _engine

    settings = get_settings()
    is_explicit_test = (
        os.environ.get("TESTING") == "1"
        or os.environ.get("PYTEST_CURRENT_TEST") is not None
        or settings.app_env == "test"
    )

    if is_explicit_test:
        _engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        from app.db.base import Base
        import app.db.models  # noqa: F401
        Base.metadata.create_all(bind=_engine)
        return _engine

    db_url = settings.database_url
    if not db_url or db_url == "intentionally-invalid-database-url":
        raise AnalysisError(ErrorCode.DATABASE_UNAVAILABLE)

    # Normalize PostgreSQL URL for psycopg3 if needed
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    try:
        _engine = create_engine(db_url, pool_pre_ping=True)
    except Exception:
        raise AnalysisError(ErrorCode.DATABASE_UNAVAILABLE) from None

    return _engine


def get_db_session() -> Generator[Session, None, None]:
    try:
        engine = get_engine()
        session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        db = session_factory()
    except AnalysisError:
        raise
    except Exception:
        raise AnalysisError(ErrorCode.DATABASE_UNAVAILABLE) from None

    try:
        yield db
    finally:
        db.close()
