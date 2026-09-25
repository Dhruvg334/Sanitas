from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_version: str = "0.1.0"

    database_url: str = ""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    cors_allowed_origins: str = "http://localhost:3000"

    max_file_bytes: int = 10 * 1024 * 1024
    max_pdf_pages: int = 15
    max_text_chars: int = Field(default=50_000, ge=1, le=50_000)
    model_timeout_seconds: int = Field(default=90, ge=1, le=300)

    rate_limit_hmac_secret: str = "change-me"
    daily_request_limit: int = 20
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
