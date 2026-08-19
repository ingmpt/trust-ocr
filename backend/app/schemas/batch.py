"""Esquemas de Lote (Batch)."""
import uuid
from datetime import datetime

from pydantic import BaseModel


class BatchSubmitResponse(BaseModel):
    batch_id: uuid.UUID
    status: str
    total_files: int
    message: str


class BatchStatusRead(BaseModel):
    id: uuid.UUID
    status: str
    processing_mode: str
    total_files: int
    processed_files: int
    failed_files: int
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class BatchDocumentRead(BaseModel):
    id: uuid.UUID
    original_filename: str
    status: str
    document_type: str | None
    page_count: int
