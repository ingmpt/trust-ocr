"""Modelos de Métodos de Pago y Facturas (HU 2.4).

Nota de arquitectura: la pasarela de pago (Culqi) y el OSE de facturación
(Nubefact) están "preparados, no integrados en el MVP" según el documento
técnico, dado que el lanzamiento es en modelo Freemium sin cobro. Estas
tablas y sus repositorios/servicios exponen la interfaz completa (HU 2.4),
pero el proveedor real se invoca a través de un adaptador stub (ver
app/services/payments y app/services/billing).
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(20), nullable=False)
    last4: Mapped[str] = mapped_column(String(4), nullable=False)
    exp_month: Mapped[int] = mapped_column(nullable=False)
    exp_year: Mapped[int] = mapped_column(nullable=False)
    is_default: Mapped[bool] = mapped_column(default=False)
    provider_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)  # id de tarjeta en Culqi
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="payment_methods")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    amount_pen: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    provider_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)  # comprobante Nubefact
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="invoices")
