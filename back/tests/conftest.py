import os
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

# Set dummy env vars before importing app modules
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

# Mock Supabase client before importing app
mock_supabase_client = MagicMock()

with patch("app.core.supabase.create_client", return_value=mock_supabase_client):
    from fastapi.testclient import TestClient

    from app.core.auth import get_current_user_id
    from app.main import app


# Test user IDs
TEST_USER_ID = str(uuid4())
OTHER_USER_ID = str(uuid4())


@pytest.fixture
def client():
    """FastAPI TestClient with auth override."""

    def override_get_current_user_id():
        return TEST_USER_ID

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
def client_no_auth():
    """FastAPI TestClient without auth (for 401 tests)."""
    app.dependency_overrides.clear()
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_document():
    """Sample document data."""
    return {
        "id": str(uuid4()),
        "user_id": TEST_USER_ID,
        "title": "Test Document",
        "content_text": "This is test content for the document.",
        "source_type": "text",
        "source_url": None,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }


@pytest.fixture
def other_user_document():
    """Document owned by another user."""
    return {
        "id": str(uuid4()),
        "user_id": OTHER_USER_ID,
        "title": "Other User Document",
        "content_text": "Content owned by another user.",
        "source_type": "text",
        "source_url": None,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }


@pytest.fixture
def sample_quiz(sample_document):
    """Sample quiz data."""
    return {
        "id": str(uuid4()),
        "user_id": TEST_USER_ID,
        "document_id": sample_document["id"],
        "title": "Test Quiz",
        "question_count": 3,
        "difficulty": "medium",
        "created_at": "2024-01-01T00:00:00Z",
    }


@pytest.fixture
def sample_questions(sample_quiz):
    """Sample questions data."""
    return [
        {
            "id": str(uuid4()),
            "quiz_id": sample_quiz["id"],
            "question": "What is 2 + 2?",
            "choices": ["3", "4", "5", "6"],
            "correct_index": 1,
            "explanation": "2 + 2 equals 4",
            "source_excerpt": "Basic math",
            "created_at": "2024-01-01T00:00:00Z",
        },
        {
            "id": str(uuid4()),
            "quiz_id": sample_quiz["id"],
            "question": "What is the capital of France?",
            "choices": ["London", "Berlin", "Paris", "Madrid"],
            "correct_index": 2,
            "explanation": "Paris is the capital of France",
            "source_excerpt": "Geography",
            "created_at": "2024-01-01T00:00:01Z",
        },
        {
            "id": str(uuid4()),
            "quiz_id": sample_quiz["id"],
            "question": "Which planet is closest to the Sun?",
            "choices": ["Venus", "Mercury", "Mars", "Earth"],
            "correct_index": 1,
            "explanation": "Mercury is the closest planet to the Sun",
            "source_excerpt": "Astronomy",
            "created_at": "2024-01-01T00:00:02Z",
        },
    ]


@pytest.fixture
def sample_quiz_with_questions(sample_quiz, sample_questions):
    """Quiz with questions included."""
    quiz = sample_quiz.copy()
    quiz["questions"] = sample_questions
    return quiz


def create_mock_execute_result(data):
    """Create a mock Supabase execute() result."""
    mock_result = MagicMock()
    mock_result.data = data
    return mock_result


def create_mock_table(data_or_fn):
    """Create a mock Supabase table with chainable methods."""
    mock_table = MagicMock()

    # Handle different data scenarios
    if callable(data_or_fn):
        mock_table.insert.return_value.execute.side_effect = data_or_fn
        mock_table.select.return_value.eq.return_value.single.return_value.execute.side_effect = (
            data_or_fn
        )
        mock_table.select.return_value.eq.return_value.order.return_value.execute.side_effect = (
            data_or_fn
        )
        mock_table.select.return_value.eq.return_value.execute.side_effect = data_or_fn
        mock_table.update.return_value.eq.return_value.execute.side_effect = data_or_fn
        mock_table.delete.return_value.eq.return_value.execute.side_effect = data_or_fn
    else:
        result = create_mock_execute_result(data_or_fn)
        mock_table.insert.return_value.execute.return_value = result
        mock_table.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            result
        )
        mock_table.select.return_value.eq.return_value.order.return_value.execute.return_value = (
            result
        )
        mock_table.select.return_value.eq.return_value.execute.return_value = result
        mock_table.update.return_value.eq.return_value.execute.return_value = result
        mock_table.delete.return_value.eq.return_value.execute.return_value = result

    return mock_table
