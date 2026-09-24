import os
from pathlib import Path
import subprocess
import sys

from app.core.config import Settings


def test_settings_without_environment_or_secrets(monkeypatch, tmp_path) -> None:
    monkeypatch.chdir(tmp_path)
    for name in list(os.environ):
        if name.lower() in Settings.model_fields:
            monkeypatch.delenv(name)

    settings = Settings()

    assert settings.app_env == "development"
    assert settings.app_version == "0.1.0"
    assert settings.gemini_api_key == ""
    assert settings.cors_origins == ["http://localhost:3000"]


def test_settings_load_dotenv_and_environment_override(monkeypatch, tmp_path) -> None:
    monkeypatch.chdir(tmp_path)
    for name in list(os.environ):
        if name.lower() in Settings.model_fields:
            monkeypatch.delenv(name)
    (tmp_path / ".env").write_text("APP_VERSION=0.2.0\n", encoding="utf-8")
    monkeypatch.setenv(
        "CORS_ALLOWED_ORIGINS", " https://review.example, ,http://localhost:3001 "
    )
    assert Settings().app_version == "0.2.0"
    monkeypatch.setenv("APP_VERSION", "0.3.0")
    settings = Settings()

    assert settings.app_version == "0.3.0"
    assert settings.cors_origins == [
        "https://review.example",
        "http://localhost:3001",
    ]


def test_startup_and_cors_without_database_or_model(tmp_path) -> None:
    # A fresh process proves import/startup do not initialize the database or SDK.
    env = {
        name: value
        for name, value in os.environ.items()
        if name.lower() not in Settings.model_fields
    }
    env.update(
        PYTHONPATH=str(Path(__file__).resolve().parents[1]),
        DATABASE_URL="intentionally-invalid-database-url",
        GEMINI_API_KEY="",
        APP_VERSION="0.9.0",
        CORS_ALLOWED_ORIGINS=" https://review.example, http://localhost:3001 ",
    )
    result = subprocess.run(
        [sys.executable, "-c", """
import sys
sys.modules['app.db.session'] = None
sys.modules['google.genai'] = None
from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    response = client.get('/health', headers={'Origin': 'https://review.example'})
    assert response.status_code == 200
    assert response.json() == {
        'status': 'ok', 'service': 'sanitas-api', 'version': '0.9.0'
    }
    assert response.headers['access-control-allow-origin'] == 'https://review.example'
    assert 'access-control-allow-credentials' not in response.headers
    allowed = client.options('/health', headers={
        'Origin': 'http://localhost:3001', 'Access-Control-Request-Method': 'GET'
    })
    assert allowed.status_code == 200
    denied = client.options('/health', headers={
        'Origin': 'https://untrusted.example', 'Access-Control-Request-Method': 'GET'
    })
    assert denied.status_code == 400
    assert 'access-control-allow-origin' not in denied.headers
"""],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 0, result.stdout + result.stderr
