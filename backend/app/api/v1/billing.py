"""Endpoints de Métodos de Pago y Facturas (HU 2.4)."""
import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.billing import InvoiceRead, PaymentMethodCreate, PaymentMethodRead
from app.services.billing_service import InvoiceService, PaymentService

router = APIRouter(tags=["billing"])


@router.get("/payment-methods", response_model=list[PaymentMethodRead])
def list_payment_methods(current_user: CurrentUser, db: DbSession):
    return PaymentService(db).list_payment_methods(current_user)


@router.post("/payment-methods", response_model=PaymentMethodRead, status_code=status.HTTP_201_CREATED)
def add_payment_method(payload: PaymentMethodCreate, current_user: CurrentUser, db: DbSession):
    return PaymentService(db).add_payment_method(
        current_user, payload.card_number, payload.exp_month, payload.exp_year, payload.cardholder_name
    )


@router.delete("/payment-methods/{payment_method_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_payment_method(payment_method_id: uuid.UUID, current_user: CurrentUser, db: DbSession):
    PaymentService(db).remove_payment_method(current_user, payment_method_id)


@router.get("/invoices", response_model=list[InvoiceRead])
def list_invoices(current_user: CurrentUser, db: DbSession):
    return InvoiceService(db).list_invoices(current_user)
