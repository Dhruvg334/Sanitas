from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Response

from app.core.config import Settings, get_settings
from app.core.errors import AnalysisError, ErrorCode, ErrorResponse
from app.schemas.extraction import AnalysisRequest, AnalysisResponse, ClinicalExtraction, Processing
from app.services.canonicalize import canonicalize
from app.services.evidence import validate_evidence
from app.services.extraction_prompt import PROMPT_VERSION
from app.services.gemini import Extractor, get_extractor

router = APIRouter(prefix="/api/v1", tags=["analyses"])


@router.post("/analyses", response_model=AnalysisResponse, responses={
    status: {"model": ErrorResponse} for status in (400, 413, 422, 429, 500, 502, 503, 504)
})
async def analyse(
    body: AnalysisRequest,
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
    extractor: Annotated[Extractor, Depends(get_extractor)],
) -> AnalysisResponse:
    try:
        document = canonicalize(body.text, settings.max_text_chars)
        extraction = await extractor.extract(document)
        # Revalidate the typed provider boundary before applying the evidence gate.
        extraction = ClinicalExtraction.model_validate(extraction.model_dump())
        validate_evidence(extraction, document)
        response.headers["Cache-Control"] = "no-store"
        return AnalysisResponse(
            analysis_id=str(uuid4()), canonical_document=document,
            clinical_extraction=extraction,
            processing=Processing(model=settings.gemini_model, prompt_version=PROMPT_VERSION),
        )
    except AnalysisError:
        raise
    except Exception:
        raise AnalysisError(ErrorCode.INTERNAL_ERROR) from None
