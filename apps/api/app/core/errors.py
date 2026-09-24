from enum import StrEnum
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse

from app.schemas.extraction import StrictModel


class ErrorCode(StrEnum):
    EMPTY_INPUT = "EMPTY_INPUT"
    TEXT_TOO_LARGE = "TEXT_TOO_LARGE"
    INVALID_REQUEST = "INVALID_REQUEST"
    MODEL_RATE_LIMITED = "MODEL_RATE_LIMITED"
    MODEL_TIMEOUT = "MODEL_TIMEOUT"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    MODEL_RESPONSE_INVALID = "MODEL_RESPONSE_INVALID"
    EVIDENCE_VALIDATION_FAILED = "EVIDENCE_VALIDATION_FAILED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# Only these application-owned strings may cross the error boundary.
ERRORS = {
    ErrorCode.EMPTY_INPUT: (400, "Enter a synthetic clinical note before submitting.", True, "Provide a non-empty synthetic clinical note in the text field."),
    ErrorCode.TEXT_TOO_LARGE: (413, "The note exceeds the configured text limit. Shorten it and try again.", True, "Shorten the note below the character limit."),
    ErrorCode.INVALID_REQUEST: (422, "Send a JSON object containing only a text string. Files are not supported.", False, "Ensure the request body contains a 'text' property."),
    ErrorCode.MODEL_RATE_LIMITED: (429, "The extraction service is at capacity. Try again later.", True, "Wait a moment before submitting another request."),
    ErrorCode.MODEL_TIMEOUT: (504, "The extraction service took too long. Try a shorter note or try again later.", True, "Try submitting a shorter note or retrying shortly."),
    ErrorCode.MODEL_UNAVAILABLE: (503, "The extraction service is unavailable. Check the service configuration or try again later.", True, "Verify the service configuration and Gemini API key."),
    ErrorCode.MODEL_RESPONSE_INVALID: (502, "The extraction could not be validated. No result has been displayed. Try again.", True, "Resubmit the note or verify the note content."),
    ErrorCode.EVIDENCE_VALIDATION_FAILED: (502, "The extraction could not be matched to the source. No result has been displayed. Try again.", True, "Resubmit the note or ensure statements are explicitly grounded in the text."),
    ErrorCode.INTERNAL_ERROR: (500, "The request could not be completed. Try again later.", False, "Please contact support if the issue persists."),
}


class SafeError(StrictModel):
    code: str
    message: str
    recoverable: bool = True
    suggestion: str | None = None
    correlation_id: str


class ErrorResponse(StrictModel):
    error: SafeError


class AnalysisError(Exception):
    def __init__(self, code: ErrorCode):
        self.code = code
        super().__init__(code.value)


def error_response(code: ErrorCode) -> JSONResponse:
    status, message, recoverable, suggestion = ERRORS[code]
    body = ErrorResponse(error=SafeError(
        code=code.value,
        message=message,
        recoverable=recoverable,
        suggestion=suggestion,
        correlation_id=str(uuid4()),
    ))
    return JSONResponse(status_code=status, content=body.model_dump(), headers={"Cache-Control": "no-store"})


async def handle_analysis_error(_request: Request, exc: AnalysisError) -> JSONResponse:
    return error_response(exc.code)


async def handle_validation_error(_request: Request, _exc: Exception) -> JSONResponse:
    # FastAPI's default validation detail includes input values; never return it.
    return error_response(ErrorCode.INVALID_REQUEST)
