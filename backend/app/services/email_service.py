"""Envío de correo transaccional (Zoho SMTP). Si no hay credenciales
configuradas, cae a un adaptador de log (mismo patrón que OCR/LLM/storage
mock) para poder seguir probando el flujo sin bloquear el desarrollo/QA.
"""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_zoho(to_email: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.zoho_from_email
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.zoho_smtp_host, settings.zoho_smtp_port) as smtp:
        smtp.starttls()
        smtp.login(settings.zoho_smtp_user, settings.zoho_smtp_password)
        smtp.send_message(message)


def send_verification_email(to_email: str, verification_link: str) -> None:
    subject = "Verifica tu correo — Trust OCR+"
    body = (
        f"Hola,\n\nConfirma tu cuenta en Trust OCR+ ingresando al siguiente enlace "
        f"(válido por 24 horas):\n\n{verification_link}\n\nSi no creaste esta cuenta, ignora este correo."
    )

    if settings.zoho_smtp_user and settings.zoho_smtp_password:
        _send_via_zoho(to_email, subject, body)
        return

    # Sin credenciales de Zoho: se registra el enlace en el log para pruebas manuales.
    logger.warning("ZOHO_SMTP_USER/PASSWORD no configurados. Enlace de verificación para %s: %s", to_email, verification_link)
