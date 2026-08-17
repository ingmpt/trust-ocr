"""Servicio de Notificaciones (Zoho SMTP), abstraído para permitir cambio de proveedor.

HU 1.3, 2.2, 2.4: confirmaciones de procesamiento, cambios de plan, pagos.
En APP_ENV=local sin credenciales SMTP configuradas, los envíos se registran
en log en vez de fallar, para no bloquear el desarrollo local.
"""
import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("trustocr.notifications")


class NotificationService:
    def _send(self, to_email: str, subject: str, body: str) -> None:
        if not settings.zoho_smtp_user or not settings.zoho_smtp_password:
            logger.info("SMTP no configurado; simulando envío a %s | asunto=%s", to_email, subject)
            return

        message = MIMEText(body)
        message["Subject"] = subject
        message["From"] = settings.zoho_from_email
        message["To"] = to_email

        with smtplib.SMTP(settings.zoho_smtp_host, settings.zoho_smtp_port) as server:
            server.starttls()
            server.login(settings.zoho_smtp_user, settings.zoho_smtp_password)
            server.send_message(message)

    def send_processing_complete(self, to_email: str, document_id: str) -> None:
        self._send(to_email, "Tu documento ha sido procesado", f"El documento {document_id} está listo para su descarga.")

    def send_plan_change_confirmation(self, to_email: str, plan_name: str) -> None:
        self._send(to_email, "Confirmación de cambio de plan", f"Tu plan ha sido actualizado a {plan_name}.")

    def send_usage_warning(self, to_email: str, usage_percent: float) -> None:
        self._send(to_email, "Estás cerca de tu límite de páginas", f"Has usado el {usage_percent}% de tu cuota mensual.")

    def send_payment_confirmation(self, to_email: str, amount: float) -> None:
        self._send(to_email, "Pago procesado con éxito", f"Se ha procesado un pago de S/ {amount:.2f}.")

    def send_payment_failed(self, to_email: str) -> None:
        self._send(to_email, "Pago fallido", "No pudimos procesar tu pago. Actualiza tu método de pago para evitar interrupciones.")

    def send_arco_confirmation(self, to_email: str | None, right_type: str, validation_token: str) -> None:
        if not to_email:
            logger.info("Solicitud ARCO %s registrada, token=%s (sin correo de contacto)", right_type, validation_token)
            return
        self._send(to_email, "Confirmación de solicitud ARCO", f"Tu solicitud de {right_type} fue recibida. Token: {validation_token}.")
