"""
LangGraph 기반 퀴즈 생성 에이전트
"""
import json
import logging
from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from app.core.config import settings
from app.schemas.quiz import Difficulty, LLMQuizOutput, QuestionSchema

logger = logging.getLogger(__name__)


class QuizState(TypedDict):
    document_id: str
    document_content: str
    question_count: int
    difficulty: Difficulty
    quiz_output: LLMQuizOutput | None
    error: str | None
    retry_count: int


def get_llm():
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        temperature=0.7,
    )


async def generate_quiz_with_llm(state: QuizState) -> QuizState:
    """LLM을 사용하여 퀴즈 생성"""
    logger.info("=== 퀴즈 생성 시작 ===")
    logger.info(f"문서 ID: {state['document_id']}")
    logger.info(f"문서 길이: {len(state['document_content'])}자")
    logger.debug(f"문서 미리보기: {state['document_content'][:300]}...")
    logger.info(f"난이도: {state['difficulty']}, 문제 수: {state['question_count']}")

    llm = get_llm()

    difficulty_map = {
        Difficulty.EASY: "쉬움 (기본 개념 확인, 직접적인 질문)",
        Difficulty.MEDIUM: "보통 (응용 문제 포함, 약간의 추론 필요)",
        Difficulty.HARD: "어려움 (심화 문제, 함정 선택지 포함, 깊은 이해 필요)",
    }

    system_prompt = f"""당신은 교육용 퀴즈 생성 전문가입니다.
주어진 자료를 바탕으로 객관식 4지선다 퀴즈를 생성하세요.

규칙:
1. 반드시 {state['question_count']}개의 문제를 생성하세요.
2. 난이도: {difficulty_map[state['difficulty']]}
3. 각 문제는 자료에 근거해야 합니다.
4. 선택지는 그럴듯하지만 명확히 구분되어야 합니다.
5. 해설은 왜 정답인지, 왜 오답인지 설명해야 합니다.
6. source_excerpt에는 정답의 근거가 되는 원문 발췌를 포함하세요.
7. correct_index는 0부터 3 사이의 정수입니다.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):
{{
  "title": "자료 내용을 반영한 퀴즈 제목",
  "questions": [
    {{
      "question": "문제 텍스트",
      "choices": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correct_index": 0,
      "explanation": "정답 해설 (왜 이것이 정답인지, 다른 선택지는 왜 오답인지)",
      "source_excerpt": "자료에서 발췌한 근거 문장"
    }}
  ]
}}"""

    user_prompt = f"""다음 자료를 바탕으로 {state['question_count']}개의 퀴즈를 생성하세요:

---
{state['document_content'][:30000]}
---"""

    content = None  # 에러 핸들러에서 사용하기 위해 초기화
    try:
        logger.info("LLM 호출 중...")
        response = await llm.ainvoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
        )
        logger.info(f"LLM 응답 수신 완료. 응답 타입: {type(response)}")

        # 응답 내용 확인
        content = response.content
        if not content:
            logger.error(f"LLM 응답이 비어있습니다! response 객체: {response}")
            state["error"] = "LLM이 빈 응답을 반환했습니다. 콘텐츠 필터링 또는 API 오류일 수 있습니다."
            state["retry_count"] = state.get("retry_count", 0) + 1
            return state

        logger.info(f"LLM 응답 길이: {len(content)}자")
        logger.debug(f"LLM 응답 미리보기: {content[:200]}...")

        # JSON 파싱
        content = content.strip()

        # 마크다운 코드 블록 제거
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        parsed = json.loads(content.strip())
        state["quiz_output"] = LLMQuizOutput(**parsed)
        state["error"] = None

    except json.JSONDecodeError as e:
        logger.error(f"JSON 파싱 오류: {e}")
        logger.error(f"파싱 시도한 content: {content[:500] if content else 'None'}...")
        state["error"] = f"JSON 파싱 오류: {str(e)}"
        state["retry_count"] = state.get("retry_count", 0) + 1
    except Exception as e:
        logger.error(f"예외 발생: {type(e).__name__}: {e}")
        state["error"] = str(e)
        state["retry_count"] = state.get("retry_count", 0) + 1

    return state


async def validate_output(state: QuizState) -> QuizState:
    """출력 검증"""
    if state.get("error"):
        return state

    quiz = state.get("quiz_output")
    if not quiz:
        state["error"] = "퀴즈 생성 실패"
        return state

    if len(quiz.questions) != state["question_count"]:
        state["error"] = f"문제 수 불일치: {len(quiz.questions)} != {state['question_count']}"
        state["retry_count"] = state.get("retry_count", 0) + 1
        return state

    # 각 문제 검증
    for i, q in enumerate(quiz.questions):
        if len(q.choices) != 4:
            state["error"] = f"문제 {i+1}: 선택지가 4개가 아님"
            state["retry_count"] = state.get("retry_count", 0) + 1
            return state
        if not (0 <= q.correct_index <= 3):
            state["error"] = f"문제 {i+1}: correct_index가 0-3 범위를 벗어남"
            state["retry_count"] = state.get("retry_count", 0) + 1
            return state

    return state


def should_retry(state: QuizState) -> str:
    """재시도 여부 결정"""
    if state.get("error") and state.get("retry_count", 0) < 2:
        return "retry"
    return "end"


# LangGraph 워크플로우 정의
workflow = StateGraph(QuizState)

workflow.add_node("generate_quiz", generate_quiz_with_llm)
workflow.add_node("validate", validate_output)

workflow.set_entry_point("generate_quiz")
workflow.add_edge("generate_quiz", "validate")
workflow.add_conditional_edges(
    "validate",
    should_retry,
    {
        "retry": "generate_quiz",
        "end": END,
    },
)

quiz_graph = workflow.compile()


class QuizGenerateResult:
    def __init__(self, title: str, questions: list[QuestionSchema]):
        self.title = title
        self.questions = questions


async def generate_quiz(
    document_id: str,
    document_content: str,
    question_count: int,
    difficulty: Difficulty,
) -> QuizGenerateResult:
    """퀴즈 생성 메인 함수"""
    initial_state: QuizState = {
        "document_id": document_id,
        "document_content": document_content,
        "question_count": question_count,
        "difficulty": difficulty,
        "quiz_output": None,
        "error": None,
        "retry_count": 0,
    }

    result = await quiz_graph.ainvoke(initial_state)

    if result.get("error"):
        raise Exception(result["error"])

    quiz_output = result["quiz_output"]

    return QuizGenerateResult(
        title=quiz_output.title,
        questions=quiz_output.questions,
    )
