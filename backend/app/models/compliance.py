"""Modelos del Portal ARCO y Registro de Auditoría (HU 3.2, 3.3)."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ArcoRequest(Base):
    __tablename__ = "arco_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dni: Mapped[str] = mapped_column(String(8), nullable=False, index=True)
    right_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente")
    validation_token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    identity_document_ref: Mapped[str] = mapped_column(String(500), nullable=False)  # storage key de la foto de DNI
    details: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)  # motivo, campos a rectificar, etc.
    report_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # PDF generado para "Acceso"
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    """Log append-only. La inmutabilidad se refuerza con firma/hash de un proveedor
    externo (ver app/services/audit.py); mientras no se seleccione proveedor, el
    campo external_signature queda nulo y la integridad depende sólo de PostgreSQL.
    """

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String(255), nullable=False)  # user_id, "system" o DNI del solicitante ARCO
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    external_signature: Mapped[str | None] = mapped_column(String(500), nullable=True)
    external_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
