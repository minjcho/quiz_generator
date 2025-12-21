from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# 루트 .env 파일 경로 (back/app/core/config.py -> 루트)
ROOT_DIR = Path(__file__).parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Quiz Generator API"
    VERSION: str = "0.1.0"

    # CORS (comma-separated for env var, e.g., "http://localhost:3000,http://frontend:3000")
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS string into list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Supabase (SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL 사용)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""  # JWT 검증용 (선택사항, 없으면 검증 스킵)

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # LangSmith (optional)
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "quiz-generator"


settings = Settings()
