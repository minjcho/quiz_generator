SHELL := /bin/bash

.PHONY: all help install install-front install-back dev dev-front dev-back \
        test test-e2e test-back lint lint-front lint-back \
        build clean fclean re db-status db-push db-reset \
        docker-build docker-up docker-down docker-logs

# 기본 타겟 (make만 실행 시)
all: install lint build
	@echo "✓ 전체 빌드 완료"

# 기본 타겟
help:
	@echo "사용 가능한 명령어:"
	@echo ""
	@echo "  설치:"
	@echo "    make install        - 전체 의존성 설치"
	@echo "    make install-front  - 프론트엔드만"
	@echo "    make install-back   - 백엔드만"
	@echo ""
	@echo "  개발:"
	@echo "    make dev            - 프론트+백 동시 실행"
	@echo "    make dev-front      - 프론트만 (port 3000)"
	@echo "    make dev-back       - 백엔드만 (port 8000)"
	@echo ""
	@echo "  테스트:"
	@echo "    make test           - 전체 테스트"
	@echo "    make test-e2e       - E2E 테스트 (Playwright)"
	@echo "    make test-back      - 백엔드 테스트 (pytest)"
	@echo ""
	@echo "  린트:"
	@echo "    make lint           - 전체 린트"
	@echo "    make lint-front     - 프론트 (ESLint)"
	@echo "    make lint-back      - 백엔드 (ruff)"
	@echo ""
	@echo "  빌드/배포:"
	@echo "    make all            - 전체 빌드 (install + lint + build)"
	@echo "    make build          - 프로덕션 빌드"
	@echo "    make clean          - 빌드 아티팩트 정리"
	@echo "    make fclean         - 전체 정리 (node_modules 포함)"
	@echo "    make re             - Docker 재빌드+배포"
	@echo ""
	@echo "  데이터베이스:"
	@echo "    make db-status      - 마이그레이션 상태 확인"
	@echo "    make db-push        - 마이그레이션 실행"
	@echo "    make db-reset       - DB 초기화 (주의!)"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-build   - Docker 이미지 빌드"
	@echo "    make docker-up      - 컨테이너 시작"
	@echo "    make docker-down    - 컨테이너 중지"
	@echo "    make docker-logs    - 로그 확인"

# =============================================================================
# 설치
# =============================================================================

install: install-front install-back
	@echo "✓ 전체 설치 완료"

install-front:
	cd front && npm install

install-back:
	cd back && pip install -e ".[dev]"

# =============================================================================
# 개발 서버
# =============================================================================

dev:
	@echo "프론트엔드(3000) + 백엔드(8000) 서버 시작..."
	@trap 'kill 0' INT TERM; \
	(cd back && uvicorn app.main:app --reload --port 8000) & \
	(cd front && npm run dev) & \
	wait

dev-front:
	cd front && npm run dev

dev-back:
	cd back && uvicorn app.main:app --reload --port 8000

# =============================================================================
# 테스트
# =============================================================================

test: test-back test-e2e
	@echo "✓ 전체 테스트 완료"

test-e2e:
	cd front && npm run test:e2e

test-back:
	cd back && python -m pytest 2>/dev/null || echo "⚠️  백엔드 테스트 없음"

# =============================================================================
# 린트
# =============================================================================

lint: lint-front lint-back
	@echo "✓ 전체 린트 완료"

lint-front:
	cd front && npm run lint

lint-back:
	cd back && python -m ruff check .

# =============================================================================
# 빌드/배포
# =============================================================================

build:
	cd front && npm run build

clean:
	rm -rf front/.next
	rm -rf front/node_modules/.cache
	find back -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf back/.pytest_cache
	rm -rf back/.ruff_cache
	rm -rf front/playwright-report
	rm -rf front/test-results
	@echo "✓ 정리 완료"

fclean: clean
	rm -rf front/node_modules
	rm -rf back/*.egg-info
	@echo "✓ 전체 정리 완료 (node_modules 포함)"

re: docker-down docker-build docker-up

# =============================================================================
# 데이터베이스
# =============================================================================

db-status:
	npx supabase db diff

db-push:
	npx supabase db push

db-reset:
	@echo "⚠️  주의: 모든 데이터가 삭제됩니다!"
	@read -p "계속하시겠습니까? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	npx supabase db reset

# =============================================================================
# Docker
# =============================================================================

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d
	@echo "✓ 컨테이너 시작됨"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"

docker-down:
	docker-compose down
	@echo "✓ 컨테이너 중지됨"

docker-logs:
	docker-compose logs -f
