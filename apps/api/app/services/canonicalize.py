from app.core.errors import AnalysisError, ErrorCode
from app.schemas.extraction import CanonicalDocument, SourceSegment


def canonicalize(text: str | None, max_chars: int) -> CanonicalDocument:
    if text is None:
        raise AnalysisError(ErrorCode.EMPTY_INPUT)
    # Check before trimming so whitespace cannot bypass the size bound.
    if len(text) > max_chars:
        raise AnalysisError(ErrorCode.TEXT_TOO_LARGE)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        raise AnalysisError(ErrorCode.EMPTY_INPUT)
    return CanonicalDocument(segments=[
        SourceSegment(segment_id=f"p1-s{index}", text=line)
        for index, line in enumerate(lines, start=1)
    ])
