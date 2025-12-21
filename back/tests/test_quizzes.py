from unittest.mock import AsyncMock, MagicMock, patch

from app.agents.quiz_generator import QuizGenerateResult
from app.schemas.quiz import QuestionSchema
from tests.conftest import (
    OTHER_USER_ID,
    TEST_USER_ID,
    create_mock_execute_result,
    create_mock_table,
)


def create_mock_quiz_result(title: str, questions: list[dict]) -> QuizGenerateResult:
    """Create a mock QuizGenerateResult."""
    question_schemas = [
        QuestionSchema(
            question=q["question"],
            choices=q["choices"],
            correct_index=q["correct_index"],
            explanation=q["explanation"],
            source_excerpt=q["source_excerpt"],
        )
        for q in questions
    ]
    return QuizGenerateResult(title=title, questions=question_schemas)


class TestGenerateQuiz:
    """POST /api/quizzes/generate tests."""

    def test_generate_quiz_success(
        self, client, sample_document, sample_quiz, sample_questions
    ):
        """Successfully generate a quiz."""
        # Mock document service
        mock_doc_table = create_mock_table(sample_document)

        # Mock quiz service
        mock_quiz_table = create_mock_table([sample_quiz])
        mock_questions_table = create_mock_table(sample_questions)

        # Mock LLM result
        mock_llm_result = create_mock_quiz_result(
            title="Generated Quiz",
            questions=[
                {
                    "question": q["question"],
                    "choices": q["choices"],
                    "correct_index": q["correct_index"],
                    "explanation": q["explanation"],
                    "source_excerpt": q["source_excerpt"],
                }
                for q in sample_questions
            ],
        )

        with (
            patch(
                "app.services.document_service.document_service.table", mock_doc_table
            ),
            patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table),
            patch(
                "app.services.quiz_service.quiz_service.questions", mock_questions_table
            ),
            patch(
                "app.api.quizzes.generate_quiz",
                new=AsyncMock(return_value=mock_llm_result),
            ),
        ):
            response = client.post(
                "/api/quizzes/generate",
                json={
                    "document_id": sample_document["id"],
                    "question_count": 3,
                    "difficulty": "medium",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "quiz_id" in data
        assert "title" in data
        assert "questions" in data
        assert len(data["questions"]) == 3

    def test_generate_quiz_document_not_found(self, client):
        """Generate quiz with non-existent document returns 404."""
        mock_doc_table = create_mock_table(None)

        with patch(
            "app.services.document_service.document_service.table", mock_doc_table
        ):
            response = client.post(
                "/api/quizzes/generate",
                json={
                    "document_id": "non-existent-id",
                    "question_count": 5,
                    "difficulty": "easy",
                },
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Document not found"

    def test_generate_quiz_document_forbidden(self, client, other_user_document):
        """Generate quiz from another user's document returns 403."""
        mock_doc_table = create_mock_table(other_user_document)

        with patch(
            "app.services.document_service.document_service.table", mock_doc_table
        ):
            response = client.post(
                "/api/quizzes/generate",
                json={
                    "document_id": other_user_document["id"],
                    "question_count": 5,
                    "difficulty": "easy",
                },
            )

        assert response.status_code == 403
        assert response.json()["detail"] == "Access denied"


class TestListQuizzes:
    """GET /api/quizzes tests."""

    def test_list_quizzes_success(self, client, sample_quiz):
        """Successfully list user's quizzes."""
        mock_quiz_table = create_mock_table([sample_quiz])

        with patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table):
            response = client.get("/api/quizzes")

        assert response.status_code == 200
        data = response.json()
        assert "quizzes" in data
        assert len(data["quizzes"]) == 1

    def test_list_quizzes_empty(self, client):
        """List quizzes returns empty when user has no quizzes."""
        mock_quiz_table = create_mock_table([])

        with patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table):
            response = client.get("/api/quizzes")

        assert response.status_code == 200
        data = response.json()
        assert data["quizzes"] == []


class TestGetQuiz:
    """GET /api/quizzes/{id} tests."""

    def test_get_quiz_success(self, client, sample_quiz_with_questions):
        """Successfully get a quiz with questions."""
        quiz = sample_quiz_with_questions
        mock_quiz_table = create_mock_table(quiz)
        mock_questions_table = create_mock_table(quiz["questions"])

        with (
            patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table),
            patch(
                "app.services.quiz_service.quiz_service.questions", mock_questions_table
            ),
        ):
            response = client.get(f"/api/quizzes/{quiz['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == quiz["id"]
        assert "questions" in data

    def test_get_quiz_not_found(self, client):
        """Get non-existent quiz returns 404."""
        mock_quiz_table = create_mock_table(None)

        with patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table):
            response = client.get("/api/quizzes/non-existent-id")

        assert response.status_code == 404
        assert response.json()["detail"] == "Quiz not found"

    def test_get_quiz_forbidden(self, client, sample_quiz_with_questions):
        """Get quiz owned by another user returns 403."""
        quiz = sample_quiz_with_questions.copy()
        quiz["user_id"] = OTHER_USER_ID

        mock_quiz_table = create_mock_table(quiz)
        mock_questions_table = create_mock_table(quiz["questions"])

        with (
            patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table),
            patch(
                "app.services.quiz_service.quiz_service.questions", mock_questions_table
            ),
        ):
            response = client.get(f"/api/quizzes/{quiz['id']}")

        assert response.status_code == 403
        assert response.json()["detail"] == "Access denied"


class TestSubmitQuiz:
    """POST /api/quizzes/{id}/submit tests."""

    def test_submit_quiz_success(self, client, sample_quiz_with_questions):
        """Successfully submit and score a quiz."""
        quiz = sample_quiz_with_questions
        questions = quiz["questions"]

        # All correct answers
        answers = {q["id"]: q["correct_index"] for q in questions}

        mock_quiz_table = create_mock_table(quiz)
        mock_questions_table = create_mock_table(questions)
        mock_attempts_table = create_mock_table(
            [{"id": "attempt-id", "score": 3, "total": 3}]
        )

        with (
            patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table),
            patch(
                "app.services.quiz_service.quiz_service.questions", mock_questions_table
            ),
            patch(
                "app.services.quiz_service.quiz_service.attempts", mock_attempts_table
            ),
        ):
            response = client.post(
                f"/api/quizzes/{quiz['id']}/submit",
                json={"answers": answers},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 3
        assert data["total"] == 3
        assert data["percentage"] == 100.0
        assert len(data["results"]) == 3

    def test_submit_quiz_partial_score(self, client, sample_quiz_with_questions):
        """Submit quiz with some wrong answers."""
        quiz = sample_quiz_with_questions
        questions = quiz["questions"]

        # Only first answer correct, others wrong
        answers = {questions[0]["id"]: questions[0]["correct_index"]}
        for q in questions[1:]:
            answers[q["id"]] = (q["correct_index"] + 1) % 4  # Wrong answer

        mock_quiz_table = create_mock_table(quiz)
        mock_questions_table = create_mock_table(questions)
        mock_attempts_table = create_mock_table(
            [{"id": "attempt-id", "score": 1, "total": 3}]
        )

        with (
            patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table),
            patch(
                "app.services.quiz_service.quiz_service.questions", mock_questions_table
            ),
            patch(
                "app.services.quiz_service.quiz_service.attempts", mock_attempts_table
            ),
        ):
            response = client.post(
                f"/api/quizzes/{quiz['id']}/submit",
                json={"answers": answers},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 1
        assert data["total"] == 3

    def test_submit_quiz_not_found(self, client):
        """Submit non-existent quiz returns 404."""
        mock_quiz_table = create_mock_table(None)

        with patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table):
            response = client.post(
                "/api/quizzes/non-existent-id/submit",
                json={"answers": {}},
            )

        assert response.status_code == 404

    def test_submit_quiz_forbidden(self, client, sample_quiz_with_questions):
        """Submit quiz owned by another user returns 403."""
        quiz = sample_quiz_with_questions.copy()
        quiz["user_id"] = OTHER_USER_ID

        mock_quiz_table = create_mock_table(quiz)
        mock_questions_table = create_mock_table(quiz["questions"])

        with (
            patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table),
            patch(
                "app.services.quiz_service.quiz_service.questions", mock_questions_table
            ),
        ):
            response = client.post(
                f"/api/quizzes/{quiz['id']}/submit",
                json={"answers": {}},
            )

        assert response.status_code == 403


class TestDeleteQuiz:
    """DELETE /api/quizzes/{id} tests."""

    def test_delete_quiz_success(self, client, sample_quiz):
        """Successfully delete a quiz."""
        mock_quiz_table = create_mock_table(sample_quiz)
        mock_quiz_table.delete.return_value.eq.return_value.execute.return_value = (
            create_mock_execute_result([sample_quiz])
        )

        with patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table):
            response = client.delete(f"/api/quizzes/{sample_quiz['id']}")

        assert response.status_code == 200
        assert response.json()["message"] == "Quiz deleted"

    def test_delete_quiz_not_found(self, client):
        """Delete non-existent quiz returns 404."""
        mock_quiz_table = create_mock_table(None)

        with patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table):
            response = client.delete("/api/quizzes/non-existent-id")

        assert response.status_code == 404

    def test_delete_quiz_forbidden(self, client, sample_quiz):
        """Delete quiz owned by another user returns 403."""
        quiz = sample_quiz.copy()
        quiz["user_id"] = OTHER_USER_ID

        mock_quiz_table = create_mock_table(quiz)

        with patch("app.services.quiz_service.quiz_service.quizzes", mock_quiz_table):
            response = client.delete(f"/api/quizzes/{quiz['id']}")

        assert response.status_code == 403
