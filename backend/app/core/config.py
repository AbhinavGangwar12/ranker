from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ranker"
    PROJECT_VERSION: str = "0.1.0"

    # Must use an ASYNC driver — e.g. postgresql+asyncpg://user:pass@host/db
    # (plain postgresql:// / sqlite:// will NOT work with create_async_engine)
    DATABASE_URL: str
    DB_ECHO: bool = False

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    GROQ_API_KEY: str
    # LLM_MODEL: str = "llama-3.1-8b-instant"
    LLM_MODEL: str = "openai/gpt-oss-20b"
    LLM_TEMPERATURE: float = 0.5

    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_PROJECT: str = "ai-leaderboard"

    # Comma-separated in .env, e.g. CORS_ORIGINS=http://localhost:5173,https://yourapp.vercel.app
    CORS_ORIGINS_RAW: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]


settings = Settings()
