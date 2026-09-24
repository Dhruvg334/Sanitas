"""Adaptive document ingestion, validation, fingerprinting, and routing."""

from dataclasses import dataclass
import hashlib
import io
from typing import Literal

import filetype
import pymupdf as fitz
from PIL import Image, ImageOps

from app.core.config import Settings
from app.core.errors import AnalysisError, ErrorCode

SourceType = Literal["plain_text", "digital_pdf", "scanned_or_visual_pdf", "image"]


@dataclass
class IngestedDocument:
    raw_text: str | None
    file_bytes: bytes | None
    filename: str | None
    declared_mime: str | None
    detected_mime: str | None
    sha256: str
    size_bytes: int
    source_type: SourceType
    page_count: int = 1


def route_document(
    settings: Settings,
    text: str | None = None,
    file_bytes: bytes | None = None,
    filename: str | None = None,
    declared_mime: str | None = None,
) -> IngestedDocument:
    has_text = text is not None and bool(text.strip())
    has_file = file_bytes is not None and len(file_bytes) > 0

    if has_text and has_file:
        raise AnalysisError(ErrorCode.MULTIPLE_INPUTS)
    if not has_text and not has_file:
        raise AnalysisError(ErrorCode.EMPTY_INPUT)

    if has_text:
        assert text is not None
        if len(text) > settings.max_text_chars:
            raise AnalysisError(ErrorCode.TEXT_TOO_LARGE)

        encoded = text.encode("utf-8")
        sha256_hash = hashlib.sha256(encoded).hexdigest()
        return IngestedDocument(
            raw_text=text,
            file_bytes=None,
            filename=None,
            declared_mime="text/plain",
            detected_mime="text/plain",
            sha256=sha256_hash,
            size_bytes=len(encoded),
            source_type="plain_text",
            page_count=1,
        )

    # File flow
    assert file_bytes is not None
    if len(file_bytes) > settings.max_file_bytes:
        raise AnalysisError(ErrorCode.FILE_TOO_LARGE)

    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    lower_filename = (filename or "").lower()

    # Detect MIME by byte signature
    detected_mime: str | None = None
    if file_bytes.startswith(b"%PDF-"):
        detected_mime = "application/pdf"
    else:
        guess = filetype.guess(file_bytes[:2048])
        if guess:
            detected_mime = guess.mime

    # Validation against filename extension mismatch
    if lower_filename.endswith(".pdf"):
        if detected_mime != "application/pdf":
            raise AnalysisError(ErrorCode.FILE_SIGNATURE_MISMATCH)
    elif any(lower_filename.endswith(ext) for ext in (".jpg", ".jpeg", ".png")):
        if detected_mime not in ("image/jpeg", "image/png"):
            raise AnalysisError(ErrorCode.FILE_SIGNATURE_MISMATCH)
    elif detected_mime not in ("application/pdf", "image/jpeg", "image/png"):
        raise AnalysisError(ErrorCode.UNSUPPORTED_FILE_TYPE)

    if detected_mime == "application/pdf":
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception:
            raise AnalysisError(ErrorCode.CORRUPTED_FILE)

        try:
            page_count = len(doc)
            if page_count == 0:
                raise AnalysisError(ErrorCode.EMPTY_INPUT)
            if page_count > settings.max_pdf_pages:
                raise AnalysisError(ErrorCode.PDF_PAGE_LIMIT_EXCEEDED)

            # Routing heuristic: check per-page printable character ratio
            digital_pages = 0
            for page in doc:
                page_text = page.get_text()
                meaningful_chars = len("".join(page_text.split()))
                if meaningful_chars >= 80:
                    digital_pages += 1

            source_type: SourceType = (
                "digital_pdf" if (digital_pages / page_count) >= 0.80 else "scanned_or_visual_pdf"
            )
        finally:
            doc.close()

        return IngestedDocument(
            raw_text=None,
            file_bytes=file_bytes,
            filename=filename,
            declared_mime=declared_mime or "application/pdf",
            detected_mime=detected_mime,
            sha256=sha256_hash,
            size_bytes=len(file_bytes),
            source_type=source_type,
            page_count=page_count,
        )

    # Image flow
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img.verify()
    except Exception:
        raise AnalysisError(ErrorCode.IMAGE_DECODE_FAILED)

    return IngestedDocument(
        raw_text=None,
        file_bytes=file_bytes,
        filename=filename,
        declared_mime=declared_mime or detected_mime,
        detected_mime=detected_mime,
        sha256=sha256_hash,
        size_bytes=len(file_bytes),
        source_type="image",
        page_count=1,
    )
