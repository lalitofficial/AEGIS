import os
import tempfile

import pytest
from fastapi.testclient import TestClient

# Configure the environment before the app (and its cached settings) is imported.
_TEST_DB_PATH = os.path.join(tempfile.mkdtemp(prefix="aegis-test-"), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["API_KEY"] = "test-api-key"
os.environ["DEBUG"] = "False"

from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.utils.security import get_password_hash  # noqa: E402

TEST_API_KEY = "test-api-key"
TEST_USER_EMAIL = "analyst@example.com"
TEST_USER_PASSWORD = "test-password-123"


@pytest.fixture(scope="session")
def client():
    # Entering the context runs the lifespan handler, which initializes the schema.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def api_headers():
    return {"X-API-Key": TEST_API_KEY}


@pytest.fixture(scope="session")
def test_user(client):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == TEST_USER_EMAIL).first()
        if not user:
            user = User(
                email=TEST_USER_EMAIL,
                username="analyst",
                full_name="Test Analyst",
                hashed_password=get_password_hash(TEST_USER_PASSWORD),
                role="analyst",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        yield user
    finally:
        db.close()
