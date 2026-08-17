"""Servicio de créditos de página, cuotas y pago por uso (HU 2.1, 2.3).

Regla de negocio clave (Backlog HU 2.3): el sistema resta el crédito de página
ANTES de iniciar el procesamiento de un documento. Si el saldo llega a 0 y el
plan no permite sobreuso facturable (Freemium), responde 402 Payment Required.
Para planes de pago, el exceso se registra como "overage" y se factura al
cierre de ciclo (HU 2.3), sin bloquear al usuario salvo que también supere
el límite de sobreuso permitido por política interna.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import CreditTransactionType, PlanCode
from app.models.subscription import CreditTransaction, Subscription
from app.models.user import User
from app.repositories.subscription_repository import SubscriptionRepository

USAGE_WARNING_THRESHOLD = 0.8


class InsufficientCreditsError(HTTPException):
    def __init__(self, detail: str = "Créditos agotados. Actualice su plan o espere al próximo ciclo de facturación."):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)


class CreditService:
    def __init__(self, db: Session):
        self.db = db
        self.subscriptions = SubscriptionRepository(db)

    def get_active_subscription(self, user: User) -> Subscription:
        subscription = self.subscriptions.get_active_for_user(user.id)
        if subscription is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "El usuario no tiene una suscripción activa.")
        return subscription

    def pages_remaining(self, subscription: Subscription) -> int:
        return max(subscription.plan.included_pages - subscription.pages_used, 0)

    def usage_percent(self, subscription: Subscription) -> float:
        if subscription.plan.included_pages == 0:
            return 100.0
        return round(min(subscription.pages_used / subscription.plan.included_pages, 1.0) * 100, 2)

    def reserve_pages(self, subscription: Subscription, pages: int) -> None:
        """Descuenta créditos antes de procesar (HU 2.3). Freemium bloquea con 402 al agotarse;
        los planes de pago permiten sobreuso, que se registra para facturación posterior (HU 2.3)."""
        remaining = self.pages_remaining(subscription)
        is_freemium = subscription.plan.code == PlanCode.FREEMIUM.value

        if is_freemium and pages > remaining:
            raise InsufficientCreditsError()

        subscription.pages_used += pages
        self.subscriptions.save(subscription)

        overage_pages = max(pages - remaining, 0) if not is_freemium else 0
        transaction_type = CreditTransactionType.OVERAGE.value if overage_pages > 0 else CreditTransactionType.CONSUMPTION.value
        self.subscriptions.add_credit_transaction(
            CreditTransaction(subscription_id=subscription.id, transaction_type=transaction_type, pages=pages)
        )
        self.db.commit()

    def is_near_limit(self, subscription: Subscription) -> bool:
        return self.usage_percent(subscription) >= USAGE_WARNING_THRESHOLD * 100
