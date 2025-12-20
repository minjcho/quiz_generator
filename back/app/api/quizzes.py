from fastapi import APIRouter, HTTPException, Header

from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuestionResult,
)
from app.agents.quiz_generator import generate_quiz
from app.services.quiz_service import quiz_service
from app.services.document_service import document_service

router = APIRouter()


def get_user_id(authorization: str | None) -> str:
    """임시: Authorization 헤더에서 user_id 추출"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    if authorization.startswith("Bearer "):
        return authorization[7:]
    return authorization


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz_endpoint(
    request: QuizGenerateRequest,
    authorization: str | None = Header(None),
):
    """퀴즈 생성 (LangGraph Agent 호출)"""
    user_id = get_user_id(authorization)

    # 문서 존재 및 소유권 확인
    document = await document_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if document["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # LangGraph 에이전트로 퀴즈 생성
        result = await generate_quiz(
            document_id=request.document_id,
            document_content=document["content_text"],
            question_count=request.question_count,
            difficulty=request.difficulty,
        )

        # DB에 퀴즈 저장
        quiz = await quiz_service.create_quiz(
            user_id=user_id,
            document_id=request.document_id,
            title=result.title,
            question_count=request.question_count,
            difficulty=request.difficulty.value,
        )

        # DB에 문제들 저장
        await quiz_service.create_questions(
            quiz_id=quiz["id"],
            questions=result.questions,
        )

        return QuizGenerateResponse(
            quiz_id=quiz["id"],
            title=result.title,
            questions=result.questions,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    authorization: str | None = Header(None),
):
    """퀴즈 상세 조회 (문제 포함)"""
    user_id = get_user_id(authorization)

    quiz = await quiz_service.get_quiz_with_questions(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if quiz["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    quiz_id: str,
    request: QuizSubmitRequest,
    authorization: str | None = Header(None),
):
    """퀴즈 제출 및 채점"""
    user_id = get_user_id(authorization)

    quiz = await quiz_service.get_quiz_with_questions(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if quiz["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 채점
    questions = quiz["questions"]
    results = []
    correct_count = 0

    for q in questions:
        question_id = q["id"]
        selected_index = request.answers.get(question_id, -1)
        correct_index = q["correct_index"]
        is_correct = selected_index == correct_index

        if is_correct:
            correct_count += 1

        results.append(
            QuestionResult(
                question_id=question_id,
                correct=is_correct,
                selected_index=selected_index,
                correct_index=correct_index,
                explanation=q["explanation"],
                source_excerpt=q["source_excerpt"],
            )
        )

    total = len(questions)
    percentage = round((correct_count / total) * 100, 1) if total > 0 else 0

    # 시도 기록 저장
    await quiz_service.create_attempt(
        quiz_id=quiz_id,
        user_id=user_id,
        answers=request.answers,
        score=correct_count,
        total=total,
    )

    return QuizSubmitResponse(
        score=correct_count,
        total=total,
        percentage=percentage,
        results=results,
    )


@router.get("")
async def list_quizzes(authorization: str | None = Header(None)):
    """퀴즈 목록 조회"""
    user_id = get_user_id(authorization)
    quizzes = await quiz_service.get_quizzes_by_user(user_id)
    return {"quizzes": quizzes}


@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    authorization: str | None = Header(None),
):
    """퀴즈 삭제"""
    user_id = get_user_id(authorization)

    quiz = await quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if quiz["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    success = await quiz_service.delete_quiz(quiz_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete quiz")

    return {"message": "Quiz deleted"}
