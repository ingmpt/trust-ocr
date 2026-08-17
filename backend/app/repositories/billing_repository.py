"""Acceso a datos para PaymentMethod e Invoice."""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.billing import Invoice, PaymentMethod


class PaymentMethodRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: uuid.UUID) -> list[PaymentMethod]:
        return list(self.db.scalars(select(PaymentMethod).where(PaymentMethod.user_id == user_id)))

    def create(self, payment_method: PaymentMethod) -> PaymentMethod:
        self.db.add(payment_method)
        self.db.flush()
        return payment_method

    def get_by_id_for_user(self, payment_method_id: uuid.UUID, user_id: uuid.UUID) -> PaymentMethod | None:
        return self.db.scalar(select(PaymentMethod).where(PaymentMethod.id == payment_method_id, PaymentMethod.user_id == user_id))

    def delete(self, payment_method: PaymentMethod) -> None:
        self.db.delete(payment_method)
        self.db.flush()

    def save(self, payment_method: PaymentMethod) -> None:
        self.db.add(payment_method)
        self.db.flush()


class InvoiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: uuid.UUID) -> list[Invoice]:
        return list(self.db.scalars(select(Invoice).where(Invoice.user_id == user_id).order_by(Invoice.created_at.desc())))

    def create(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        self.db.flush()
        return invoice
