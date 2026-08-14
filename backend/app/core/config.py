from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    SECRET_KEY: str = "supersecretkey_change_in_production_987654321"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database (defaults to local SQLite file for zero-config local development)
    DATABASE_URL: str = "sqlite+aiosqlite:///./collaborative_db.sqlite"

    # Encryption
    FERNET_KEY: str = "dGVzdF9kZXZfZmVybmV0X2tleV9wbGFjZWhvbGRlcg=="

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
