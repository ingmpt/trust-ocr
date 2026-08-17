"""Esquemas de Plantillas de Documento."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FieldDefinition(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=200)


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""
    field_definitions: list[FieldDefinition]


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    field_definitions: list[FieldDefinition] | None = None


class TemplateRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    name: str
    description: str
    field_definitions: list[dict]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ExtractedFieldPreview(BaseModel):
    name: str
    label: str
    value: str | float | int | None
    confidence: float
