"""Endpoints de Planes y Suscripciones (HU 2.1, 2.2, 2.3)."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.subscription import PlanChangeRequest, PlanRead, SubscriptionRead
from app.services.credit_service import CreditService
from app.services.plan_service import PlanService

router = APIRouter(tags=["plans"])


@router.get("/plans", response_model=list[PlanRead])
def list_plans(db: DbSession):
    return PlanService(db).list_plans()


@router.get("/subscriptions/me", response_model=SubscriptionRead)
def get_my_subscription(current_user: CurrentUser, db: DbSession):
    credits = CreditService(db)
    subscription = credits.get_active_subscription(current_user)
    return SubscriptionRead(
        id=subscription.id,
        plan=subscription.plan,
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        pages_used=subscription.pages_used,
        pages_remaining=credits.pages_remaining(subscription),
        usage_percent=credits.usage_percent(subscription),
    )


@router.post("/subscriptions/me/upgrade", response_model=SubscriptionRead)
def upgrade_subscription(payload: PlanChangeRequest, current_user: CurrentUser, db: DbSession):
    credits = CreditService(db)
    subscription = PlanService(db).upgrade_plan(current_user, payload.plan_code)
    return SubscriptionRead(
        id=subscription.id,
        plan=subscription.plan,
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        pages_used=subscription.pages_used,
        pages_remaining=credits.pages_remaining(subscription),
        usage_percent=credits.usage_percent(subscription),
    )
