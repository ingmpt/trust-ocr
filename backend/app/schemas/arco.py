"""Esquemas del Portal ARCO (HU 3.2)."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ArcoIdentityVerifyRequest(BaseModel):
    dni: str = Field(min_length=8, max_length=8)


class ArcoIdentityVerifyResponse(BaseModel):
    validation_token: str
    dni: str


class ArcoAccessRequest(BaseModel):
    validation_token: str


class ArcoRectificationRequest(BaseModel):
    validation_token: str
    fields_to_rectify: dict[str, str]
    reason: str


class ArcoCancellationRequest(BaseModel):
    validation_token: str
    reason: str | None = None
    confirm: bool


class ArcoOppositionRequest(BaseModel):
    validation_token: str
    reason: str


class ArcoRequestRead(BaseModel):
    id: uuid.UUID
    dni: str
    right_type: str
    status: str
    validation_token: str
    report_url: str | None
    requested_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}
