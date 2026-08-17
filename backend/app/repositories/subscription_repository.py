"""Acceso a datos para Plan, Subscription y CreditTransaction."""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subscription import CreditTransaction, Plan, Subscription


class PlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Plan]:
        return list(self.db.scalars(select(Plan)))

    def get_by_code(self, code: str) -> Plan | None:
        return self.db.scalar(select(Plan).where(Plan.code == code))


class SubscriptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_active_for_user(self, user_id: uuid.UUID) -> Subscription | None:
        return self.db.scalar(
            select(Subscription)
            .where(Subscription.user_id == user_id, Subscription.status == "active")
            .order_by(Subscription.created_at.desc())
        )

    def create(self, subscription: Subscription) -> Subscription:
        self.db.add(subscription)
        self.db.flush()
        return subscription

    def save(self, subscription: Subscription) -> None:
        self.db.add(subscription)
        self.db.flush()

    def add_credit_transaction(self, transaction: CreditTransaction) -> CreditTransaction:
        self.db.add(transaction)
        self.db.flush()
        return transaction
