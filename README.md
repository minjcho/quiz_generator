# Quiz Generator

AI 기반 자료 분석 퀴즈 생성/풀이 웹 애플리케이션

학습 자료(텍스트/PDF/URL)를 업로드하면 AI가 자동으로 퀴즈를 생성하고, 풀이 후 정답/해설/근거를 제공합니다.

---

## 기능 목록 (RFQ 체크리스트)

### 필수 요구사항

- [x] **SNS 로그인(OAuth)**: Google OAuth + 이메일 로그인 (Supabase Auth)
- [x] **LLM API 연동**: OpenAI GPT-4o + LangGraph 에이전트로 퀴즈 자동 생성
- [x] **데이터베이스 연동**: Supabase Postgres, 4개 테이블 CRUD (documents, quizzes, questions, attempts)
- [x] **소스 코드 공유**: GitHub 저장소 + 커밋 히스토리 포함
- [x] **바이브 코딩 증빙**: [VIBE_CODING_LOG.md](./VIBE_CODING_LOG.md) 참조

### 가산점 항목

- [x] **CI/CD**: GitHub Actions (claude.yml, claude-code-review.yml, e2e.yml)
- [x] **테스트코드**: Backend Unit Test (pytest) + E2E (Playwright)
- [x] **LangGraph Agent Framework**: 퀴즈 생성 에이전트 설계
- [x] **Tailwind CSS**: v4 사용
- [x] **Headless UI/Radix UI**: shadcn/ui (Radix 기반) 컴포넌트
- [x] **TypeScript**: 프론트엔드 전체

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react |
| **Backend** | FastAPI (Python 3.11+), LangChain, LangGraph, Pydantic v2 |
| **LLM** | OpenAI GPT-4o |
| **Auth/DB** | Supabase (Postgres + Auth + Storage) |
| **Monitoring** | LangSmith (선택) |
| **DevOps** | Docker Compose, GitHub Actions |

---

## 아키텍처

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
                        └─────────────────┘
```

### 사용자 플로우

1. Google OAuth 로그인
2. 학습 자료 등록 (텍스트/PDF/URL)
3. 문항 수/난이도 선택
4. AI 퀴즈 생성 (LangGraph + OpenAI)
5. 퀴즈 풀이 및 채점
6. 결과 확인 (정답/오답/해설/근거)

---

## 로컬 실행 방법

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- Supabase 프로젝트 (무료)
- OpenAI API Key

### 1. 저장소 클론

```bash
git clone https://github.com/minjcho/quiz_generator.git
cd quiz_generator
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 아래 값들을 설정:

```env
# Supabase (https://supabase.com에서 프로젝트 생성 후 확인)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# OpenAI (https://platform.openai.com에서 발급)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 아래 스키마 실행 (DB 스키마 섹션 참조)

### 4. 프론트엔드 실행

```bash
cd front
npm install
npm run dev
```

### 5. 백엔드 실행 (새 터미널)

```bash
cd back
pip install -e .   # 또는: uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

### 6. 접속

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker로 실행 (대안)

```bash
make docker-up      # 시작
make docker-down    # 중지
make docker-logs    # 로그 확인
```

---

## DB 스키마

### ERD

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  documents   │      │   quizzes    │      │  questions   │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ id (PK)      │◄────┤│ document_id  │      │ quiz_id (FK) │
│ user_id (FK) │      │ id (PK)      │◄────┤│ id (PK)      │
│ title        │      │ user_id (FK) │      │ question     │
│ source_type  │      │ title        │      │ choices      │
│ source_url   │      │ question_cnt │      │ correct_idx  │
│ content_text │      │ difficulty   │      │ explanation  │
│ created_at   │      │ created_at   │      │ source_text  │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   attempts   │
                      ├──────────────┤
                      │ id (PK)      │
                      │ quiz_id (FK) │
                      │ user_id (FK) │
                      │ answers      │
                      │ score        │
                      │ created_at   │
                      └──────────────┘
```

### 테이블 상세

#### documents
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| user_id | uuid | FK to auth.users |
| title | text | 문서 제목 |
| source_type | text | text \| pdf \| url |
| source_url | text | URL 출처 (nullable) |
| content_text | text | 추출된 텍스트 |
| created_at | timestamptz | 생성 시각 |

#### quizzes
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| user_id | uuid | FK to auth.users |
| document_id | uuid | FK to documents |
| title | text | 퀴즈 제목 |
| question_count | int | 문항 수 |
| difficulty | text | easy \| medium \| hard |
| created_at | timestamptz | 생성 시각 |

#### questions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| quiz_id | uuid | FK to quizzes |
| question | text | 문제 내용 |
| choices | jsonb | 선택지 배열 (4개) |
| correct_index | int | 정답 인덱스 (0-3) |
| explanation | text | 해설 |
| source_excerpt | text | 출처 근거 |

#### attempts
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| quiz_id | uuid | FK to quizzes |
| user_id | uuid | FK to auth.users |
| answers | jsonb | {question_id: selected_index} |
| score | int | 점수 |
| created_at | timestamptz | 제출 시각 |

### RLS 정책

모든 테이블에 Row Level Security 적용:
- `documents`, `quizzes`, `attempts`: `user_id = auth.uid()` 조건으로 본인 데이터만 접근
- `questions`: 퀴즈 소유권으로 간접 검증

---

## API 엔드포인트

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

## 프로젝트 구조

```
quiz_generator/
├── front/                    # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/              # App Router 페이지
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   │   └── quiz/         # 퀴즈 관련 컴포넌트
│   │   ├── contexts/         # React Context (Auth 등)
│   │   ├── types/            # TypeScript 타입
│   │   └── lib/              # 유틸리티 (API, Supabase)
│   ├── e2e/                  # Playwright E2E 테스트
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
│   ├── tests/                # pytest 유닛 테스트
│   └── pyproject.toml
│
├── .github/workflows/        # GitHub Actions CI/CD
├── .env.example              # 환경변수 템플릿
├── docker-compose.yml        # Docker 통합 실행
├── Makefile                  # 개발/배포 명령어
└── README.md
```

---

## 테스트 실행

### Backend Unit Tests

```bash
cd back
pytest
```

### E2E Tests (Playwright)

```bash
cd front
npx playwright test
```

---

## 라이선스

MIT License
