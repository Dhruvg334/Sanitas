from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.api.routes.analyses import router as analyses_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.core.errors import AnalysisError, handle_analysis_error, handle_validation_error

settings = get_settings()

app = FastAPI(
    title="Sanitas API",
    version=settings.app_version,
    description="Backend API for the Sanitas AI Clinical Document Reviewer.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(analyses_router)
app.add_exception_handler(AnalysisError, handle_analysis_error)
app.add_exception_handler(RequestValidationError, handle_validation_error)
