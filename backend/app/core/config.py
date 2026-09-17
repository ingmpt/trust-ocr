"""Configuración centralizada de la aplicación, cargada desde variables de entorno.

Flujo de secretos (ver backend/app/bootstrap_secrets.py):
- Si SECRETS_PROVIDER=infisical está presente en el entorno (o en .env), todos
  los secretos de negocio (SECRET_KEY, GEMINI_API_KEY, R2_*, ZOHO_*,
  AUDIT_SIGNING_API_KEY, CULQI_*, NUBEFACT_*, etc.) se descargan de Infisical
  y se inyectan en el entorno de este proceso ANTES de construir `Settings`.
  `.env` sólo debe contener en ese caso las variables "bootstrap" para
  autenticar contra Infisical (INFISICAL_API_URL/CLIENT_ID/CLIENT_SECRET/
  PROJECT_ID/ENVIRONMENT), nunca secretos de negocio reales.
- Si SECRETS_PROVIDER no está definido, se mantiene el comportamiento legado:
  todas las variables se leen directamente de `.env` (sólo para desarrollo
  puntual sin acceso a Infisical).
"""
import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Carga .env como variables de entorno reales (idempotente) para que el chequeo
# de SECRETS_PROVIDER de abajo funcione tanto en Docker como corriendo uvicorn
# directamente desde el venv.
load_dotenv()

if os.environ.get("SECRETS_PROVIDER") == "infisical":
    from app.bootstrap_secrets import apply_to_environ

    apply_to_environ()


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
    max_online_pdf_pages: int = 5

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
