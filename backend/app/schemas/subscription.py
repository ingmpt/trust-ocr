"""Esquemas de Planes y Suscripciones (HU 2.1, 2.2, 2.3)."""
import uuid
from datetime import datetime

from pydantic import BaseModel


class PlanRead(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    monthly_price_pen: float
    included_pages: int
    overage_price_per_page_pen: float

    model_config = {"from_attributes": True}


class SubscriptionRead(BaseModel):
    id: uuid.UUID
    plan: PlanRead
    status: str
    current_period_start: datetime
    current_period_end: datetime
    pages_used: int
    pages_remaining: int
    usage_percent: float

    model_config = {"from_attributes": True}


class PlanChangeRequest(BaseModel):
    plan_code: str
