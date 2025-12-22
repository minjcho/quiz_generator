# Vibe Coding Log

이 문서는 Quiz Generator 프로젝트의 AI 기반 개발(바이브 코딩) 과정을 기록합니다.

---

## 사용한 AI 도구

- **Claude Code** (CLI 기반 AI 코딩 어시스턴트)
- **Claude Code Review** (GitHub Actions 통합 PR 리뷰)
- **Supabase MCP** (Model Context Protocol - DB/Auth 설정 조회 및 관리)

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
- `back/app/agents/quiz_generator.py` - LangGraph 워크플로우
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
- `back/tests/` - pytest 테스트 모음 (44개)
- Documents API 테스트 (15개)
- Quizzes API 테스트 (15개)
- URL Crawler 테스트 (12개)

**검증/수정**:
- `deepcopy`로 중첩 딕셔너리 테스트 격리 문제 해결

---

### 9. URL 크롤링 기능 (PR #23)

**프롬프트 의도**: URL 입력으로 자료 등록

```
URL을 입력하면 웹 페이지에서 본문을 자동 추출해서
문서로 등록하는 기능을 추가해줘.
보안을 위해 SSRF 방지도 구현해줘.
```

**결과**:
- `back/app/services/url_crawler.py` - trafilatura 기반 크롤러
- SSRF 방지 (localhost, 내부 IP 차단)
- 타임아웃 설정 (10초)

**검증/수정**:
- 다양한 URL로 크롤링 테스트
- 보안 테스트 (내부 IP 차단 확인)
- trafilatura 2.0.0 호환성 수정 (PR #24)

---

### 10. Coolify 프로덕션 배포 (PR #25, #26, #27)

**프롬프트 의도**: 프로덕션 환경 배포

```
Coolify로 배포했는데 Google 로그인하면 localhost로 리다이렉트돼.
확인하고 수정해줘.
```

**문제 1**: Docker ports vs expose
- Coolify는 리버스 프록시 사용 → `ports` 대신 `expose` 필요
- PR #25: `docker-compose.yml` 수정

**문제 2**: OAuth 콜백 origin 감지
- 리버스 프록시 뒤에서 `request.url.origin`이 내부 주소 반환
- PR #26: `getOrigin()` 함수 추가 (x-forwarded-host 헤더 확인)

```typescript
function getOrigin(request: Request): string {
  // 1. 환경변수로 명시적 설정 (최우선)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // 2. 리버스 프록시 헤더 확인
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    return `${forwardedProto}://${forwardedHost}`;
  }
  // 3. 기본값
  return new URL(request.url).origin;
}
```

**문제 3**: 404 프로필 페이지
- Navbar에 `/profile` 링크가 있지만 페이지 미구현
- PR #27: 프로필 링크 제거

**검증/수정**:
- Supabase Dashboard에서 Site URL, Redirect URLs 설정
- CORS_ORIGINS에 프로덕션 도메인 추가
- 실제 Google 로그인 테스트 완료

---

### 11. Supabase MCP 활용

**프롬프트 의도**: Supabase 설정을 CLI에서 직접 조회/관리

```
프로덕션에서 Google 로그인이 localhost로 리다이렉트돼.
Supabase MCP로 설정 확인해줘.
```

**MCP (Model Context Protocol)란?**
- Claude Code가 외부 서비스 API에 직접 접근할 수 있게 해주는 프로토콜
- Supabase MCP: Auth 설정, DB 스키마, Storage 등을 CLI에서 조회/관리

**MCP로 확인한 내용**:
```
site_url: http://ai3.minjcho.site  ← HTTP! HTTPS 필요
uri_allow_list: []  ← 콜백 URL 없음!
```

**활용 사례**:
1. OAuth 리다이렉트 문제 디버깅 - Site URL이 HTTP로 설정된 것 발견
2. Redirect URLs 목록 조회 - 콜백 URL 누락 확인
3. 프로덕션 설정 검증 - 배포 전 설정 확인

**장점**:
- Supabase Dashboard 없이 CLI에서 바로 설정 확인
- 문제 원인을 빠르게 파악
- AI가 설정값을 보고 직접 해결책 제시

---

### 12. GitHub Actions CI/CD 파이프라인

**프롬프트 의도**: 자동화된 품질 관리 체계 구축

```
GitHub Actions로 PR마다 자동으로 린트, 테스트, 빌드 체크하고,
Claude Code Review로 AI 코드 리뷰도 받을 수 있게 해줘.
```

**결과 - 4개의 워크플로우**:

#### 1. E2E 테스트 (`e2e.yml`)
```yaml
# PR 생성/업데이트 시 자동 실행
- Backend pytest (44개 테스트)
- Frontend Playwright E2E (32개 테스트)
- Supabase 연동 테스트 (실제 DB 사용)
```

**실행 과정**:
1. PR 생성 → GitHub Actions 트리거
2. Backend 서버 시작 (uvicorn)
3. Frontend 서버 시작 (next dev)
4. pytest 실행 → Playwright 실행
5. 결과 리포트 (pass/fail)

#### 2. Claude Code Review (`claude-code-review.yml`)
```yaml
# PR 생성 시 AI 자동 리뷰
- 코드 품질 점수 (0-10점)
- High/Medium/Low Priority 피드백
- 보안 취약점 검사
- 코드 스타일 제안
```

**리뷰 예시**:
```
Score: 8.5/10

High Priority:
- waitForTimeout 대신 waitForLoadState 사용 권장

Medium Priority:
- 에러 핸들링 개선 필요
- 타입 명시 권장
```

#### 3. Claude CLI (`claude.yml`)
```yaml
# 코드 수정 자동화
- 린트 에러 자동 수정
- 간단한 리팩토링
```

#### 4. 린트/빌드 체크
```yaml
# 기본 품질 검사
- ESLint (프론트엔드)
- ruff (백엔드)
- TypeScript 빌드
- Next.js 빌드
```

**검증/수정 사이클**:
1. 코드 작성 → PR 생성
2. CI 자동 실행 (테스트, 린트)
3. Claude Code Review 피드백 확인
4. High Priority 항목 수정
5. 재푸시 → CI 재실행
6. 모든 체크 통과 → 머지

**실제 활용 사례 (PR #18)**:
- Claude Review: "waitForTimeout은 flaky 테스트 유발"
- 수정: waitForLoadState로 변경
- 재리뷰: "개선됨, LGTM"
- 머지 완료

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

### 4. trafilatura 호환성 (PR #24)

**문제**: trafilatura 2.0.0에서 API 변경으로 크롤링 실패

**프롬프트**:
```
URL 크롤링이 안 되는데 확인해줘.
trafilatura 버전이 바뀌면서 뭔가 달라진 것 같아.
```

**해결**:
- `use_config()` 함수로 설정 객체 생성
- 타임아웃 설정 방식 변경
- 디버깅 로깅 추가

---

### 5. OAuth 콜백 리다이렉트 (PR #26)

**문제**: 프로덕션에서 OAuth 콜백이 `0.0.0.0:3000`으로 리다이렉트

**프롬프트**:
```
지금 http://0.0.0.0:3000/dashboard# 로 가는데
리버스 프록시 뒤에서 origin 감지가 안 되는 것 같아.
```

**해결**:
- `x-forwarded-host`, `x-forwarded-proto` 헤더 확인
- `NEXT_PUBLIC_SITE_URL` 환경변수 우선 사용
- `.env.example` 업데이트

---

## 프롬프트 작성 팁

1. **명확한 목표 제시**: "~기능을 구현해줘"보다 "~기능을 구현하고, ~조건을 만족해야 해"
2. **컨텍스트 공유**: 기존 코드 구조, 사용 중인 라이브러리 언급
3. **검증 포인트 명시**: "테스트 방법", "확인해야 할 것" 함께 요청
4. **반복적 개선**: 첫 결과에서 문제점 파악 → 추가 프롬프트로 수정
5. **에러 메시지 공유**: 문제 발생 시 전체 에러 로그를 함께 제공

---

## 개발 통계

| 항목 | 수치 |
|------|------|
| 총 PR 수 | 27개 |
| 총 커밋 수 | 41개 |
| Backend 테스트 | 44개 (pytest) |
| E2E 테스트 | 32개 (Playwright) |
| 개발 기간 | 3일 (2025-12-20 ~ 2025-12-22) |
| AI 도움 비율 | ~95% (코드 생성, 리뷰, 버그 수정, 배포) |

---

## 결론

바이브 코딩을 통해 단기간에 **OAuth + LLM + DB CRUD + 테스트 + 프로덕션 배포**가 포함된
완성도 높은 웹 서비스를 구현할 수 있었습니다.

핵심은 **"그냥 생성"이 아니라 "이해하고 검증하며 수정"**하는 것입니다.

### 배운 점

1. **AI는 초안 생성기**: 첫 결과물을 맹신하지 말고 반드시 검증
2. **테스트가 품질 보증**: AI 생성 코드도 테스트로 검증해야 안심
3. **에러는 학습 기회**: 에러 메시지를 AI에게 공유하면 빠른 해결
4. **배포는 별개 문제**: 로컬에서 되던 게 프로덕션에서 안 될 수 있음
5. **반복이 핵심**: 한 번에 완벽한 결과는 없음, 점진적 개선

### 사용 도구

| 도구 | 용도 | 활용 |
|------|------|------|
| **Claude Code CLI** | 코드 생성/수정 | 전체 기능 구현, 버그 수정, 리팩토링 |
| **Claude Code Review** | PR 자동 리뷰 | 27개 PR 모두 AI 리뷰 적용 |
| **Supabase MCP** | DB/Auth 설정 조회 | OAuth 문제 디버깅, 설정 검증 |
| **GitHub Actions** | CI/CD 자동화 | E2E 테스트, 린트, 빌드 체크 |
| **Playwright** | E2E 테스트 | 32개 테스트 시나리오 자동화 |
| **pytest** | 유닛 테스트 | 44개 백엔드 테스트 |
| **Coolify** | 프로덕션 배포 | Docker Compose + Traefik |

### GitHub Actions 워크플로우 현황

```
.github/workflows/
├── e2e.yml              # E2E + Unit Test (PR마다 실행)
├── claude-code-review.yml  # AI 코드 리뷰 (PR마다 실행)
└── claude.yml           # Claude CLI 자동화
```

**CI 파이프라인 흐름**:
```
PR 생성
   │
   ├─→ e2e.yml (pytest + playwright)
   │      └─→ 테스트 통과/실패 표시
   │
   ├─→ claude-code-review.yml
   │      └─→ 코드 리뷰 코멘트 작성
   │
   └─→ 모든 체크 통과 → 머지 가능
```
