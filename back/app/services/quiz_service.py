from app.core.supabase import get_supabase_admin
from app.schemas.quiz import QuestionSchema


class QuizService:
    def __init__(self):
        self.client = get_supabase_admin()
        self.quizzes = self.client.table("quizzes")
        self.questions = self.client.table("questions")
        self.attempts = self.client.table("attempts")

    async def create_quiz(
        self,
        user_id: str,
        document_id: str,
        title: str,
        question_count: int,
        difficulty: str,
    ) -> dict:
        """퀴즈 생성"""
        data = {
            "user_id": user_id,
            "document_id": document_id,
            "title": title,
            "question_count": question_count,
            "difficulty": difficulty,
        }
        result = self.quizzes.insert(data).execute()
        return result.data[0] if result.data else None

    async def create_questions(
        self,
        quiz_id: str,
        questions: list[QuestionSchema],
    ) -> list[dict]:
        """퀴즈 문제들 생성"""
        data = [
            {
                "quiz_id": quiz_id,
                "question": q.question,
                "choices": q.choices,
                "correct_index": q.correct_index,
                "explanation": q.explanation,
                "source_excerpt": q.source_excerpt,
            }
            for q in questions
        ]
        result = self.questions.insert(data).execute()
        return result.data or []

    async def get_quiz_by_id(self, quiz_id: str) -> dict | None:
        """퀴즈 ID로 조회"""
        result = self.quizzes.select("*").eq("id", quiz_id).single().execute()
        return result.data if result.data else None

    async def get_quiz_with_questions(self, quiz_id: str) -> dict | None:
        """퀴즈와 문제들 함께 조회"""
        quiz = await self.get_quiz_by_id(quiz_id)
        if not quiz:
            return None

        questions_result = (
            self.questions.select("*")
            .eq("quiz_id", quiz_id)
            .order("created_at")
            .execute()
        )
        quiz["questions"] = questions_result.data or []
        return quiz

    async def get_quizzes_by_user(self, user_id: str) -> list[dict]:
        """사용자의 모든 퀴즈 조회"""
        result = (
            self.quizzes.select("*, documents(title)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    async def get_quizzes_by_document(self, document_id: str) -> list[dict]:
        """문서의 모든 퀴즈 조회"""
        result = (
            self.quizzes.select("*")
            .eq("document_id", document_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    async def delete_quiz(self, quiz_id: str) -> bool:
        """퀴즈 삭제 (CASCADE로 questions도 삭제됨)"""
        result = self.quizzes.delete().eq("id", quiz_id).execute()
        return len(result.data) > 0 if result.data else False

    async def create_attempt(
        self,
        quiz_id: str,
        user_id: str,
        answers: dict,
        score: int,
        total: int,
    ) -> dict:
        """퀴즈 시도 기록 저장"""
        data = {
            "quiz_id": quiz_id,
            "user_id": user_id,
            "answers": answers,
            "score": score,
            "total": total,
        }
        result = self.attempts.insert(data).execute()
        return result.data[0] if result.data else None

    async def get_attempts_by_user(self, user_id: str) -> list[dict]:
        """사용자의 모든 시도 기록 조회"""
        result = (
            self.attempts.select("*, quizzes(title)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []


quiz_service = QuizService()
