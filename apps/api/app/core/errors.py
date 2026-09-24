from enum import StrEnum
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse

from app.schemas.extraction import ErrorResponse, SafeError, StrictModel


class ErrorCode(StrEnum):
    EMPTY_INPUT = "EMPTY_INPUT"
    MULTIPLE_INPUTS = "MULTIPLE_INPUTS"
    TEXT_TOO_LARGE = "TEXT_TOO_LARGE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
    FILE_SIGNATURE_MISMATCH = "FILE_SIGNATURE_MISMATCH"
    CORRUPTED_FILE = "CORRUPTED_FILE"
    PDF_PAGE_LIMIT_EXCEEDED = "PDF_PAGE_LIMIT_EXCEEDED"
    IMAGE_DECODE_FAILED = "IMAGE_DECODE_FAILED"
    PDF_PARSE_FAILED = "PDF_PARSE_FAILED"
    DOCUMENT_QUALITY_TOO_LOW = "DOCUMENT_QUALITY_TOO_LOW"
    VISUAL_TRANSCRIPTION_FAILED = "VISUAL_TRANSCRIPTION_FAILED"
    CANONICAL_DOCUMENT_INVALID = "CANONICAL_DOCUMENT_INVALID"
    INVALID_REQUEST = "INVALID_REQUEST"
    MODEL_RATE_LIMITED = "MODEL_RATE_LIMITED"
    MODEL_TIMEOUT = "MODEL_TIMEOUT"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    MODEL_RESPONSE_INVALID = "MODEL_RESPONSE_INVALID"
    EVIDENCE_VALIDATION_FAILED = "EVIDENCE_VALIDATION_FAILED"
    REVIEW_QUALITY_GATE_FAILED = "REVIEW_QUALITY_GATE_FAILED"
    DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE"
    DATABASE_WRITE_FAILED = "DATABASE_WRITE_FAILED"
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# Only these application-owned strings may cross the error boundary.
ERRORS = {
    ErrorCode.EMPTY_INPUT: (400, "Enter a synthetic clinical note or select a document before submitting.", True, "Provide a non-empty synthetic clinical note in text, PDF, or image form."),
    ErrorCode.MULTIPLE_INPUTS: (400, "Provide either text or a single file, not both.", True, "Submit only one document input per analysis request."),
    ErrorCode.TEXT_TOO_LARGE: (413, "The note exceeds the configured text limit. Shorten it and try again.", True, "Shorten the note below the character limit."),
    ErrorCode.FILE_TOO_LARGE: (413, "The file exceeds the maximum allowed upload size.", True, "Upload a smaller document (up to 10 MB)."),
    ErrorCode.UNSUPPORTED_FILE_TYPE: (415, "The file format is not supported. Upload a PDF, JPEG, or PNG document.", True, "Provide a supported document format: PDF (.pdf), JPEG (.jpg, .jpeg), or PNG (.png)."),
    ErrorCode.FILE_SIGNATURE_MISMATCH: (400, "The file extension does not match its detected content format.", True, "Verify the file is a valid, uncorrupted PDF or image file."),
    ErrorCode.CORRUPTED_FILE: (422, "The document file is corrupted and could not be read.", True, "Check the file integrity and try exporting or re-saving it."),
    ErrorCode.PDF_PAGE_LIMIT_EXCEEDED: (413, "The PDF exceeds the maximum page limit (15 pages).", True, "Submit a document with 15 pages or fewer."),
    ErrorCode.IMAGE_DECODE_FAILED: (422, "The image could not be decoded. Ensure it is a valid JPEG or PNG.", True, "Check the image file format and try re-saving it."),
    ErrorCode.PDF_PARSE_FAILED: (422, "Unable to extract text or structure from the PDF.", True, "Verify the PDF is not encrypted or damaged."),
    ErrorCode.DOCUMENT_QUALITY_TOO_LOW: (422, "The document quality is too degraded for reliable clinical extraction.", True, "Upload a clearer scan or enter the note as text."),
    ErrorCode.VISUAL_TRANSCRIPTION_FAILED: (502, "Visual transcription of the document could not be completed.", True, "Ensure the document is legible or submit as plain text."),
    ErrorCode.CANONICAL_DOCUMENT_INVALID: (422, "The document could not be transformed into a valid canonical structure.", True, "Verify document layout and content."),
    ErrorCode.INVALID_REQUEST: (422, "Send a valid clinical document request.", False, "Ensure the request body contains either text or a valid document file."),
    ErrorCode.MODEL_RATE_LIMITED: (429, "The extraction service is at capacity. Try again later.", True, "Wait a moment before submitting another request."),
    ErrorCode.MODEL_TIMEOUT: (504, "The extraction service took too long. Try a shorter note or try again later.", True, "Try submitting a shorter note or retrying shortly."),
    ErrorCode.MODEL_UNAVAILABLE: (503, "The extraction service is unavailable. Check the service configuration or try again later.", True, "Verify the service configuration and Gemini API key."),
    ErrorCode.MODEL_RESPONSE_INVALID: (502, "The extraction could not be validated. No result has been displayed. Try again.", True, "Resubmit the note or verify the note content."),
    ErrorCode.EVIDENCE_VALIDATION_FAILED: (502, "The extraction could not be matched to the source. No result has been displayed. Try again.", True, "Resubmit the note or ensure statements are explicitly grounded in the text."),
    ErrorCode.REVIEW_QUALITY_GATE_FAILED: (502, "The clinical review synthesis did not meet validation standards.", True, "Resubmit the document or verify evidence grounding."),
    ErrorCode.DATABASE_UNAVAILABLE: (503, "The database is currently unreachable. History and persistence are unavailable.", True, "Verify the database configuration or connection."),
    ErrorCode.DATABASE_WRITE_FAILED: (500, "Failed to persist the analysis result to the database.", False, "Contact support if the issue persists."),
    ErrorCode.NOT_FOUND: (404, "The requested analysis was not found.", False, "Check the analysis ID or select a previous analysis from history."),
    ErrorCode.INTERNAL_ERROR: (500, "The request could not be completed. Try again later.", False, "Please contact support if the issue persists."),
}


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
