from enum import Enum

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionSchema(BaseModel):
    question: str
    choices: list[str] = Field(..., min_length=4, max_length=4)
    correct_index: int = Field(..., ge=0, le=3)
    explanation: str
    source_excerpt: str


class QuizGenerateRequest(BaseModel):
    document_id: str
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: Difficulty = Difficulty.MEDIUM


class QuizGenerateResponse(BaseModel):
    quiz_id: str
    title: str
    questions: list[QuestionSchema]


class QuizSubmitRequest(BaseModel):
    answers: dict[str, int]  # {question_id: selected_index}


class QuestionResult(BaseModel):
    question_id: str
    correct: bool
    selected_index: int
    correct_index: int
    explanation: str
    source_excerpt: str


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    results: list[QuestionResult]


class LLMQuizOutput(BaseModel):
    """LLM 출력 스키마 (강제)"""

    title: str
    questions: list[QuestionSchema]
