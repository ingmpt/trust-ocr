"""Verificación de CAPTCHA (Cloudflare Turnstile).

Si no hay TURNSTILE_SECRET_KEY configurada (desarrollo local), se omite la
verificación — mismo patrón usado para el resto de adaptadores opcionales
(OCR/LLM/storage) cuando faltan credenciales.
"""
import json
import logging
import urllib.parse
import urllib.request

from app.core.config import settings

logger = logging.getLogger(__name__)

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile_token(token: str, remote_ip: str | None = None) -> bool:
    if not settings.turnstile_secret_key:
        return True
    if not token:
        return False

    payload = {"secret": settings.turnstile_secret_key, "response": token}
    if remote_ip:
        payload["remoteip"] = remote_ip

    data = urllib.parse.urlencode(payload).encode("utf-8")
    request = urllib.request.Request(VERIFY_URL, data=data, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
        return bool(result.get("success"))
    except Exception:
        logger.exception("Fallo al verificar el token de Turnstile.")
        return False
