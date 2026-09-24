import pymupdf as fitz

from app.core.errors import AnalysisError, ErrorCode
from app.schemas.extraction import CanonicalDocument, CanonicalPage, SourceSegment


def canonicalize(text: str | None, max_chars: int) -> CanonicalDocument:
    if text is None:
        raise AnalysisError(ErrorCode.EMPTY_INPUT)
    # Check before trimming so whitespace cannot bypass the size bound.
    if len(text) > max_chars:
        raise AnalysisError(ErrorCode.TEXT_TOO_LARGE)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        raise AnalysisError(ErrorCode.EMPTY_INPUT)
    page = CanonicalPage(
        page_number=1,
        segments=[
            SourceSegment(
                segment_id=f"p1-s{index}",
                page_number=1,
                text=line,
                segment_type="paragraph",
                certainty="high",
            )
            for index, line in enumerate(lines, start=1)
        ],
        unreadable_regions=[],
    )
    return CanonicalDocument(
        schema_version="1.0",
        source_type="plain_text",
        document_quality="good",
        quality_issues=[],
        pages=[page],
    )


def canonicalize_digital_pdf(file_bytes: bytes) -> CanonicalDocument:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception:
        raise AnalysisError(ErrorCode.PDF_PARSE_FAILED)

    pages: list[CanonicalPage] = []
    try:
        for page_idx, page in enumerate(doc, start=1):
            blocks = page.get_text("blocks")
            blocks.sort(key=lambda b: (b[1], b[0]))
            segments: list[SourceSegment] = []
            seg_idx = 1
            for b in blocks:
                block_text = b[4]
                for line in block_text.splitlines():
                    cleaned = line.strip()
                    if cleaned:
                        segments.append(
                            SourceSegment(
                                segment_id=f"p{page_idx}-s{seg_idx}",
                                page_number=page_idx,
                                text=cleaned,
                                segment_type="paragraph",
                                certainty="high",
                            )
                        )
                        seg_idx += 1
            unreadable = ["Page contains no native text"] if not segments else []
            pages.append(
                CanonicalPage(
                    page_number=page_idx,
                    segments=segments,
                    unreadable_regions=unreadable,
                )
            )
    finally:
        doc.close()

    if not any(page.segments for page in pages):
        raise AnalysisError(ErrorCode.PDF_PARSE_FAILED)

    return CanonicalDocument(
        schema_version="1.0",
        source_type="digital_pdf",
        document_quality="good",
        quality_issues=[],
        pages=pages,
    )
