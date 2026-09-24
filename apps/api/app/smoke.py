"""Check application import, lifespan startup, and liveness without external services."""

from fastapi.testclient import TestClient

from app.main import app


def main() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
        response.raise_for_status()
        if response.json().get("status") != "ok":
            raise RuntimeError("Application health check failed")
    print("Application import, startup, and /health passed.")


if __name__ == "__main__":
    main()
