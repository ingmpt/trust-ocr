"""Servicios de Pagos (Culqi) y Facturación Electrónica (Nubefact) (HU 2.4).

Ambos proveedores están "preparados, no integrados en el MVP" según el
documento técnico (modelo de lanzamiento Freemium sin cobro). Estas clases
exponen la interfaz completa que usará la capa de API/servicios superiores,
pero delegan en adaptadores stub que no realizan llamadas de red reales hasta
que se habilite la integración (ver CULQI_* / NUBEFACT_* en .env).
"""
import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.billing import Invoice, PaymentMethod
from app.models.user import User
from app.repositories.billing_repository import InvoiceRepository, PaymentMethodRepository
from app.services.notification_service import NotificationService

logger = logging.getLogger("trustocr.billing")


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.payment_methods = PaymentMethodRepository(db)
        self.notifications = NotificationService()

    def _gateway_enabled(self) -> bool:
        return bool(settings.culqi_secret_key)

    def add_payment_method(self, user: User, card_number: str, exp_month: int, exp_year: int, cardholder_name: str) -> PaymentMethod:
        provider_ref = None
        if self._gateway_enabled():
            # Punto de extensión: tokenizar la tarjeta contra la API de Culqi.
            logger.info("Integración Culqi habilitada pero no implementada en este MVP.")
        else:
            logger.info("CULQI_SECRET_KEY no configurada; registrando método de pago sin tokenización real (no-MVP).")

        payment_method = PaymentMethod(
            user_id=user.id,
            brand=_infer_brand(card_number),
            last4=card_number[-4:],
            exp_month=exp_month,
            exp_year=exp_year,
            is_default=len(self.payment_methods.list_for_user(user.id)) == 0,
            provider_ref=provider_ref,
        )
        self.payment_methods.create(payment_method)
        self.db.commit()
        return payment_method

    def list_payment_methods(self, user: User) -> list[PaymentMethod]:
        return self.payment_methods.list_for_user(user.id)

    def remove_payment_method(self, user: User, payment_method_id: uuid.UUID) -> None:
        payment_method = self.payment_methods.get_by_id_for_user(payment_method_id, user.id)
        if payment_method is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Método de pago no encontrado.")
        self.payment_methods.delete(payment_method)
        self.db.commit()


class InvoiceService:
    def __init__(self, db: Session):
        self.db = db
        self.invoices = InvoiceRepository(db)
        self.notifications = NotificationService()

    def _ose_enabled(self) -> bool:
        return bool(settings.nubefact_token)

    def issue_invoice(self, user: User, amount_pen: float, period_start, period_end) -> Invoice:
        provider_ref, pdf_url = None, None
        if self._ose_enabled():
            # Punto de extensión: emitir comprobante electrónico vía API de Nubefact (OSE).
            logger.info("Integración Nubefact habilitada pero no implementada en este MVP.")
        else:
            logger.info("NUBEFACT_TOKEN no configurado; factura registrada sin emisión SUNAT real (no-MVP).")

        invoice = Invoice(
            user_id=user.id,
            amount_pen=amount_pen,
            status="paid",
            period_start=period_start,
            period_end=period_end,
            provider_ref=provider_ref,
            pdf_url=pdf_url,
        )
        self.invoices.create(invoice)
        self.db.commit()

        self.notifications.send_payment_confirmation(user.email, amount_pen)
        return invoice

    def list_invoices(self, user: User) -> list[Invoice]:
        return self.invoices.list_for_user(user.id)


def _infer_brand(card_number: str) -> str:
    if card_number.startswith("4"):
        return "visa"
    if card_number[:2] in {"51", "52", "53", "54", "55"}:
        return "mastercard"
    return "desconocida"
