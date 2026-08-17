"""Servicio de Planes y actualización de suscripción con prorrateo (HU 2.2)."""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import CreditTransactionType, PlanCode
from app.models.subscription import CreditTransaction, Plan, Subscription
from app.models.user import User
from app.repositories.subscription_repository import PlanRepository, SubscriptionRepository
from app.services.notification_service import NotificationService

PLAN_RANK = {
    PlanCode.FREEMIUM.value: 0,
    PlanCode.BASICO.value: 1,
    PlanCode.CRECIMIENTO.value: 2,
    PlanCode.CORPORATIVO.value: 3,
}


class PlanService:
    def __init__(self, db: Session):
        self.db = db
        self.plans = PlanRepository(db)
        self.subscriptions = SubscriptionRepository(db)
        self.notifications = NotificationService()

    def list_plans(self) -> list[Plan]:
        return self.plans.list_all()

    def upgrade_plan(self, user: User, plan_code: str) -> Subscription:
        target_plan = self.plans.get_by_code(plan_code)
        if target_plan is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan no encontrado.")

        subscription = self.subscriptions.get_active_for_user(user.id)
        if subscription is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "El usuario no tiene una suscripción activa.")

        if PLAN_RANK[target_plan.code] <= PLAN_RANK[subscription.plan.code]:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sólo se permite actualizar a un plan superior.")

        prorated_credit_pages = self._calculate_prorated_pages(subscription, target_plan)

        subscription.plan_id = target_plan.id
        subscription.pages_used = max(subscription.pages_used - prorated_credit_pages, 0)
        self.subscriptions.save(subscription)
        self.subscriptions.add_credit_transaction(
            CreditTransaction(
                subscription_id=subscription.id,
                transaction_type=CreditTransactionType.PRORATION_ADJUSTMENT.value,
                pages=prorated_credit_pages,
            )
        )
        self.db.commit()

        self.notifications.send_plan_change_confirmation(user.email, target_plan.name)
        return subscription

    def _calculate_prorated_pages(self, subscription: Subscription, target_plan: Plan) -> int:
        """Prorratea el crédito adicional del nuevo plan por los días restantes del ciclo (HU 2.2)."""
        now = datetime.now(timezone.utc)
        period_start = subscription.current_period_start
        period_end = subscription.current_period_end
        total_days = max((period_end - period_start).days, 1)
        remaining_days = max((period_end - now).days, 0)

        extra_pages = target_plan.included_pages - subscription.plan.included_pages
        prorated_extra = round(extra_pages * (remaining_days / total_days))
        return max(prorated_extra, 0)

    def reset_monthly_credits(self, subscription: Subscription) -> None:
        """Reinicia créditos a cero uso al inicio de cada ciclo; no acumulables (HU 2.1)."""
        subscription.pages_used = 0
        subscription.current_period_start = datetime.now(timezone.utc)
        subscription.current_period_end = subscription.current_period_start + timedelta(days=30)
        self.subscriptions.save(subscription)
        self.subscriptions.add_credit_transaction(
            CreditTransaction(subscription_id=subscription.id, transaction_type=CreditTransactionType.MONTHLY_RESET.value, pages=0)
        )
        self.db.commit()
