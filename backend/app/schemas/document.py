"""Esquemas de Documentos y Resultados de Extracción (HU 1.1, 1.2, 1.3)."""
import uuid
from datetime import datetime

from pydantic import BaseModel


class ExtractedField(BaseModel):
    value: str | float | int | None
    confidence: float  # 0-100


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    status: str
    processing_mode: str
    page_count: int
    estimated_seconds: float


class DocumentResultRead(BaseModel):
    id: uuid.UUID
    status: str
    processing_mode: str
    document_type: str | None
    extracted_fields: dict[str, ExtractedField] | None
    used_template: bool
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None
    expires_at: datetime | None


class BatchUploadResponse(BaseModel):
    batch_id: uuid.UUID
    document_ids: list[uuid.UUID]
    total_documents: int
    estimated_seconds: float
