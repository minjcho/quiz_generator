# Vibe Coding Log

이 문서는 Quiz Generator 프로젝트의 AI 기반 개발(바이브 코딩) 과정을 기록합니다.

---

## 사용한 AI 도구

- **Claude Code** (CLI 기반 AI 코딩 어시스턴트)
- **Claude Code Review** (GitHub Actions 통합 PR 리뷰)

---

## 개발 과정 요약

### 1. 프로젝트 초기 설정

**프롬프트 의도**: 기본 프로젝트 구조와 기술 스택 설정

```
프로젝트 구조를 Next.js 15 + FastAPI로 구성하고,
Supabase를 인증/데이터베이스로 사용해줘.
```

**결과**:
- `front/`: Next.js 15 App Router + TypeScript
- `back/`: FastAPI + LangGraph
- Supabase Auth/Postgres 연동 설정

**검증/수정**:
- `npm run dev`, `uvicorn app.main:app --reload`로 각각 실행 확인
- Supabase 대시보드에서 테이블 생성 및 RLS 정책 설정

---

### 2. 인증 시스템 구현 (PR #9)

**프롬프트 의도**: OAuth 로그인 + 이메일 인증 추가

```
Google OAuth 로그인과 이메일/비밀번호 인증을 추가해줘.
Supabase Auth를 사용하고 JWT 토큰으로 API 인증도 구현해줘.
```

**결과**:
- `AuthContext`로 인증 상태 관리
- Google OAuth + 이메일 로그인 페이지
- FastAPI `get_current_user` 의존성으로 API 보호

**검증/수정**:
- 실제 Google 로그인 테스트
- E2E 테스트 추가 (`e2e/auth.spec.ts`)

---

### 3. 문서 관리 기능 (PR #2)

**프롬프트 의도**: 학습 자료 CRUD 구현

```
문서(자료) 등록/조회/수정/삭제 기능을 구현해줘.
텍스트/PDF/URL 타입을 지원하고,
프론트와 백엔드 API를 모두 만들어줘.
```

**결과**:
- `DocumentCreate`, `DocumentUpdate` Pydantic 스키마
- FastAPI CRUD 라우터 (`/api/documents`)
- Next.js 문서 목록/등록/수정 페이지

**검증/수정**:
- Swagger UI (`/docs`)에서 API 테스트
- 프론트엔드 폼 제출 테스트

---

### 4. LangGraph 퀴즈 생성 에이전트 (초기 구현)

**프롬프트 의도**: AI 퀴즈 생성 기능 설계

```
LangGraph를 사용해서 퀴즈 생성 에이전트를 만들어줘.
문서 내용을 분석해서 4지선다 문제를 생성하고,
각 문제마다 해설과 출처 근거를 포함해줘.
```

**결과**:
- `back/app/agents/quiz_agent.py` - LangGraph 워크플로우
- Structured Output으로 JSON 스키마 강제
- 재시도 로직 (최대 2회)

**검증/수정**:
- 다양한 문서로 퀴즈 생성 테스트
- 프롬프트 튜닝으로 문제 품질 개선
- Pydantic 검증 실패 케이스 처리

---

### 5. 퀴즈 풀이/채점 UI (초기 구현)

**프롬프트 의도**: 퀴즈 풀이 인터페이스 구현

```
퀴즈 풀이 UI를 만들어줘.
문제별 선택지, 진행률 표시, 이전/다음 네비게이션,
제출 후 결과 확인(정답/오답/해설) 기능이 필요해.
```

**결과**:
- `QuizPlayer` 컴포넌트 - 문제 풀이 UI
- `QuizResult` 컴포넌트 - 결과/해설 표시
- 진행률 바, 문제 네비게이션 버튼

**검증/수정**:
- 다양한 문항 수로 UI 테스트
- 모바일 반응형 확인
- ESLint 에러 수정 (PR #11, #12)

---

### 6. Docker 배포 설정 (PR #16)

**프롬프트 의도**: 로컬 배포 환경 구성

```
Docker Compose로 프론트/백 통합 실행 환경을 만들어줘.
환경변수는 루트 .env에서 통합 관리하고,
Makefile로 편리하게 실행할 수 있게 해줘.
```

**결과**:
- `docker-compose.yml` - 프론트/백 서비스 정의
- `Dockerfile` (front, back)
- `Makefile` - docker-up, docker-down 등

**검증/수정**:
- 컨테이너 간 네트워크 통신 문제 해결 (`backend:8000`)
- CORS 설정 추가 (`frontend:3000`)
- 환경변수 통합 (`.env` → 루트)

---

### 7. Playwright E2E 테스트 (PR #8, #9, #18)

**프롬프트 의도**: 자동화 테스트 추가

```
Playwright로 E2E 테스트를 추가해줘.
인증된 상태에서 문서 등록, 퀴즈 생성, 퀴즈 풀이 플로우를 테스트해줘.
GitHub Actions CI로 자동 실행되게 해줘.
```

**결과**:
- `e2e/documents.authenticated.ts` - 문서 CRUD 테스트
- `e2e/quiz-generation.authenticated.ts` - 퀴즈 생성 테스트
- `e2e/quiz-play.authenticated.ts` - 퀴즈 풀이 테스트
- `.github/workflows/e2e.yml` - CI 워크플로우

**검증/수정**:
- `waitForTimeout` → `waitForLoadState`로 안정성 개선
- `data-testid` 속성 추가로 선택자 신뢰성 향상
- 테스트 데이터 정리 로직 (중복 방지)

---

### 8. Backend 유닛 테스트 (PR #17)

**프롬프트 의도**: 백엔드 테스트 커버리지 확보

```
백엔드 유닛 테스트를 추가해줘.
pytest로 API 엔드포인트와 서비스 레이어를 테스트해줘.
```

**결과**:
- `back/tests/` - pytest 테스트 모음
- API 라우터 테스트
- 서비스 로직 테스트

**검증/수정**:
- `deepcopy`로 중첩 딕셔너리 테스트 격리 문제 해결

---

### 9. Claude Code Review 통합 (PR #2~)

**프롬프트 의도**: AI 코드 리뷰 자동화

```
GitHub Actions에 Claude Code Review를 추가해서
PR마다 자동으로 코드 리뷰를 받을 수 있게 해줘.
```

**결과**:
- `.github/workflows/claude-code-review.yml`
- PR 생성 시 자동 리뷰 코멘트
- 점수 (8.5/10) 및 개선 제안

**검증/수정**:
- High Priority 피드백 우선 수정
- 여러 라운드의 리뷰/수정 반복

---

## 주요 버그 수정 사례

### 1. Suspense Boundary 에러 (PR #13)

**문제**: `useSearchParams`를 Suspense 없이 사용해서 빌드 에러

**프롬프트**:
```
useSearchParams를 사용하는 페이지에서 빌드 에러가 발생해.
Suspense boundary가 필요하다고 하는데 수정해줘.
```

**해결**: 컴포넌트를 분리하고 `<Suspense>` 래핑

---

### 2. ESLint 에러 (PR #11, #12)

**문제**: any 타입 사용, 미사용 변수 등 린트 에러

**프롬프트**:
```
ESLint 에러를 모두 수정해줘.
```

**해결**: 타입 명시, 미사용 변수 제거, exhaustive-deps 수정

---

### 3. 테스트 안정성 (PR #18)

**문제**: `waitForTimeout` 사용으로 CI에서 flaky 테스트

**프롬프트**:
```
PR 리뷰에서 waitForTimeout 대신
waitForLoadState를 사용하라고 해서 수정해줘.
```

**해결**: 하드코딩된 타임아웃 → 이벤트 기반 대기로 변경

---

## 프롬프트 작성 팁

1. **명확한 목표 제시**: "~기능을 구현해줘"보다 "~기능을 구현하고, ~조건을 만족해야 해"
2. **컨텍스트 공유**: 기존 코드 구조, 사용 중인 라이브러리 언급
3. **검증 포인트 명시**: "테스트 방법", "확인해야 할 것" 함께 요청
4. **반복적 개선**: 첫 결과에서 문제점 파악 → 추가 프롬프트로 수정

---

## 개발 통계

- **총 PR 수**: 18개
- **총 커밋 수**: 30+
- **개발 기간**: 1일 (2025-12-21)
- **AI 도움 비율**: ~90% (코드 생성, 리뷰, 버그 수정)

---

## 결론

바이브 코딩을 통해 단기간에 OAuth + LLM + DB CRUD + 테스트가 포함된
완성도 높은 웹 서비스를 구현할 수 있었습니다.

핵심은 **"그냥 생성"이 아니라 "이해하고 검증하며 수정"**하는 것입니다.
AI가 생성한 코드를 맹목적으로 사용하지 않고,
테스트와 리뷰를 통해 품질을 확보하는 과정이 중요합니다.
