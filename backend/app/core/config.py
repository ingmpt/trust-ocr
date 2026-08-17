"""Configuración centralizada de la aplicación, cargada desde variables de entorno."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Aplicación
    app_env: str = "local"
    app_debug: bool = True
    secret_key: str = "change-me"

    # Base de datos
    database_url: str = "postgresql+psycopg2://trustocr:trustocr@localhost:5433/trustocr"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    express_result_ttl_seconds: int = 3600

    # Auth
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    api_key_prefix: str = "tocr_"

    # OCR
    ocr_engine: str = "mock"

    # LLM
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"

    # Almacenamiento (Cloudflare R2)
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "trust-ocr-documents"
    r2_endpoint_url: str = ""
    storage_retention_days: int = 5

    # Correo (Zoho)
    zoho_smtp_host: str = "smtp.zoho.com"
    zoho_smtp_port: int = 587
    zoho_smtp_user: str = ""
    zoho_smtp_password: str = ""
    zoho_from_email: str = "no-reply@trustocr.com"

    # Auditoría
    audit_signing_provider: str = "none"
    audit_signing_api_key: str = ""

    # Pagos / facturación (preparado, no integrado en MVP)
    culqi_public_key: str = ""
    culqi_secret_key: str = ""
    nubefact_token: str = ""
    nubefact_ruc_emisor: str = ""

    # Frontend
    frontend_origin: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
