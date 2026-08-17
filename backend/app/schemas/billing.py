"""Esquemas de Métodos de Pago y Facturas (HU 2.4)."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PaymentMethodCreate(BaseModel):
    card_number: str = Field(min_length=13, max_length=19)
    exp_month: int = Field(ge=1, le=12)
    exp_year: int
    cvv: str = Field(min_length=3, max_length=4)
    cardholder_name: str


class PaymentMethodRead(BaseModel):
    id: uuid.UUID
    brand: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool

    model_config = {"from_attributes": True}


class InvoiceRead(BaseModel):
    id: uuid.UUID
    amount_pen: float
    status: str
    period_start: datetime
    period_end: datetime
    pdf_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
