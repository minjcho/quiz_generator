# Quiz Generator — 자료 기반 퀴즈 생성/풀이 웹 애플리케이션 (MVP)

이 문서는 Claude(및 AI 코딩 도구)가 본 프로젝트를 일관되게 구현하도록 돕는 "개발 지침/컨텍스트"입니다.
목표는 **OAuth + LLM + DB CRUD + 퀴즈 풀이/채점**이 포함된 실행 가능한 웹 서비스를 만드는 것입니다.

---

## 프로젝트 구조

```
ai3/
├── front/                    # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/              # App Router 페이지
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   │   └── quiz/         # 퀴즈 관련 컴포넌트
│   │   ├── contexts/         # React Context (Auth 등)
│   │   ├── types/            # TypeScript 타입
│   │   └── lib/              # 유틸리티 (API, Supabase)
│   ├── Dockerfile
│   └── package.json
│
├── back/                     # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py           # FastAPI 앱 진입점
│   │   ├── core/             # 설정, Auth, Supabase 클라이언트
│   │   ├── api/              # API 라우터
│   │   ├── agents/           # LangGraph 에이전트
│   │   ├── schemas/          # Pydantic 스키마
│   │   └── services/         # 비즈니스 로직 (CRUD)
│   ├── Dockerfile
│   └── pyproject.toml
│
├── .env                      # 환경변수 (통합)
├── .env.example              # 환경변수 템플릿
├── docker-compose.yml        # Docker 통합 실행
├── Makefile                  # 개발/배포 명령어
├── .gitignore
└── CLAUDE.md
```

---

## 개발 커맨드

### Frontend (port 3000)
```bash
cd front
npm install
npm run dev
```

### Backend (port 8000)
```bash
cd back
pip install -e .    # 또는 uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

### 동시 실행 (터미널 2개)
```bash
# Terminal 1
cd front && npm run dev

# Terminal 2
cd back && uvicorn app.main:app --reload
```

### Docker 실행
```bash
make docker-up      # 컨테이너 시작 (Frontend:3000, Backend:8000)
make docker-down    # 컨테이너 중지
make docker-re      # 재빌드 + 시작
make docker-logs    # 로그 확인
```

---

## 환경변수

### 루트 .env (통합)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# OpenAI
OPENAI_API_KEY=xxx
OPENAI_MODEL=gpt-4o

# LangSmith (선택)
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=xxx
LANGCHAIN_PROJECT=quiz-generator
```

---

## 기술 스택

### Frontend (front/)
- Next.js 15 (App Router), TypeScript
- Tailwind CSS v4, shadcn/ui (Radix 기반)
- lucide-react (아이콘)

### Backend (back/)
- FastAPI (Python 3.11+)
- LangChain / LangGraph (LLM 오케스트레이션)
- LangSmith (모니터링/디버깅)
- Pydantic v2 (스키마 검증)

### Infra
- Auth/DB/Storage: Supabase (Postgres + Auth + Storage)
- LLM: OpenAI (GPT-4o)
- 로컬 배포: Docker Compose
- 프로덕션: Vercel (Front) + Railway/Render (Back)

---

## 현재 구현 상태

- [x] 프론트엔드 기본 설정 (Next.js + Tailwind + shadcn/ui)
- [x] 퀴즈 풀이 UI (QuizPlayer 컴포넌트)
- [x] 퀴즈 결과 UI (QuizResult 컴포넌트)
- [x] FastAPI 백엔드 구조
- [x] LangGraph 퀴즈 생성 에이전트
- [x] Supabase 연동 (Auth, DB)
- [x] OAuth 로그인 (Google + Email)
- [x] 문서 CRUD API (Backend + Frontend)
- [x] 퀴즈 CRUD API (Backend + Frontend)
- [x] 프론트-백 API 연동 (Bearer Token)
- [x] Docker 배포 설정

---

## 아키텍처 개요

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js       │────▶│   FastAPI       │────▶│   Supabase      │
│   (Frontend)    │     │   (Backend)     │     │   (DB/Auth)     │
│   :3000         │     │   :8000         │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │   LangGraph     │
                        │   Quiz Agent    │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   OpenAI API    │
                        │   + LangSmith   │
                        └─────────────────┘
```

### 데이터 흐름
1. Login (Supabase Auth)
2. documents 저장 (Supabase DB)
3. FastAPI /generate 요청
4. LangGraph Agent → OpenAI
5. questions 저장 (Supabase DB)
6. quiz play → submit → score 저장

---

## 핵심 사용자 플로우

1) 로그인 (Google OAuth)
2) 자료 등록 (텍스트/PDF/URL)
3) 문항 수/난이도 선택
4) 퀴즈 생성 (LLM)
5) 퀴즈 풀이/채점
6) 결과(오답/해설/근거) 저장 및 재학습

---

## DB 스키마 (Supabase)

### documents
| Column | Type | Note |
|--------|------|------|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| title | text | |
| source_type | text | text\|pdf\|url |
| source_url | text | nullable |
| content_text | text | |
| created_at | timestamptz | |

### quizzes
| Column | Type | Note |
|--------|------|------|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| document_id | uuid | FK documents |
| title | text | |
| question_count | int | |
| difficulty | text | easy\|medium\|hard |
| created_at | timestamptz | |

### questions
| Column | Type | Note |
|--------|------|------|
| id | uuid | PK |
| quiz_id | uuid | FK quizzes |
| question | text | |
| choices | jsonb | string[] |
| correct_index | int | 0-3 |
| explanation | text | |
| source_excerpt | text | |

### attempts
| Column | Type | Note |
|--------|------|------|
| id | uuid | PK |
| quiz_id | uuid | FK quizzes |
| user_id | uuid | FK auth.users |
| answers | jsonb | {question_id: selected_index} |
| score | int | |
| created_at | timestamptz | |

### RLS 정책
- documents/quizzes/attempts: `user_id = auth.uid()`
- questions: quiz 소유권으로 간접 검증

---

## API 엔드포인트

### Backend (FastAPI :8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | 헬스체크 |
| POST | /api/documents | 문서 생성 |
| GET | /api/documents | 문서 목록 |
| GET | /api/documents/{id} | 문서 상세 |
| PATCH | /api/documents/{id} | 문서 수정 |
| DELETE | /api/documents/{id} | 문서 삭제 |
| POST | /api/quizzes/generate | 퀴즈 생성 (LLM) |
| GET | /api/quizzes | 퀴즈 목록 |
| GET | /api/quizzes/{id} | 퀴즈 상세 |
| POST | /api/quizzes/{id}/submit | 퀴즈 제출/채점 |
| DELETE | /api/quizzes/{id} | 퀴즈 삭제 |

---

## LLM 출력 스키마 (강제)

```json
{
  "title": "string",
  "questions": [
    {
      "question": "string",
      "choices": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string",
      "source_excerpt": "string"
    }
  ]
}
```

서버에서 Pydantic으로 검증, 실패 시 재시도 (최대 2회)

---

## 코딩 컨벤션

### Frontend
- TypeScript strict mode
- 컴포넌트명: PascalCase
- 함수명: camelCase
- shadcn/ui 컴포넌트 활용

### Backend
- Python 3.11+
- Type hints 필수
- Pydantic v2 스키마
- async/await 사용
- ruff로 린트

---

## 다음 단계

1. Backend 유닛 테스트 추가
2. E2E 테스트 인증 환경변수 설정
3. 프로덕션 배포 (Vercel + Railway/Render)
4. PDF/URL 파싱 기능 구현
