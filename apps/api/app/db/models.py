"""Database models for Sanitas analysis lifecycle and persistence."""

from datetime import datetime, timezone
from typing import Any
import uuid

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")
UUID_TYPE = Uuid(as_uuid=True).with_variant(PG_UUID(as_uuid=True), "postgresql")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    document_quality: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quality_issues: Mapped[list[str]] = mapped_column(JSON_TYPE, nullable=False, default=list)

    canonical_document: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    clinical_extraction: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    clinical_review: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)

    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    prompt_versions: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False, default=dict)
    timings_ms: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False, default=dict)

    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    error_message_safe: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    processing_events: Mapped[list["ProcessingEvent"]] = relationship(
        "ProcessingEvent", back_populates="analysis", cascade="all, delete-orphan", order_by="ProcessingEvent.created_at"
    )

    __table_args__ = (
        Index("ix_analyses_created_at_desc", created_at.desc()),
    )


class ProcessingEvent(Base):
    __tablename__ = "processing_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    stage: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON_TYPE, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="processing_events")

    __table_args__ = (
        Index("ix_processing_events_analysis_created", "analysis_id", "created_at"),
    )
