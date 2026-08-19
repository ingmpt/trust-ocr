"""Modelo de Documento y Resultado de Extracción (HU 1.1, 1.2, 1.3, 3.1)."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    batch_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("batches.id"), nullable=True, index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    processing_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    document_type: Mapped[str] = mapped_column(String(30), nullable=True)
    page_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)  # sólo modo "almacenado"
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)  # sólo "almacenado"

    user: Mapped["User"] = relationship(back_populates="documents")
    batch: Mapped["Batch | None"] = relationship(back_populates="documents")
    extraction_result: Mapped["ExtractionResult | None"] = relationship(
        back_populates="document", uselist=False, cascade="all, delete-orphan"
    )


class ExtractionResult(Base):
    """Resultado persistido sólo para modo 'Almacenado'. El modo 'Express' vive únicamente en Redis."""

    __tablename__ = "extraction_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id"), unique=True, nullable=False)
    extracted_fields: Mapped[dict] = mapped_column(JSONB, nullable=False)  # {campo: {value, confidence}}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship(back_populates="extraction_result")
