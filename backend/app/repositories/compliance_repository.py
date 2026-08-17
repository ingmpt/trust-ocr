"""Acceso a datos para ArcoRequest y AuditLog (append-only)."""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compliance import ArcoRequest, AuditLog


class ArcoRequestRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, request: ArcoRequest) -> ArcoRequest:
        self.db.add(request)
        self.db.flush()
        return request

    def get_by_token(self, validation_token: str) -> ArcoRequest | None:
        return self.db.scalar(select(ArcoRequest).where(ArcoRequest.validation_token == validation_token))

    def list_by_dni(self, dni: str) -> list[ArcoRequest]:
        return list(self.db.scalars(select(ArcoRequest).where(ArcoRequest.dni == dni).order_by(ArcoRequest.requested_at.desc())))

    def save(self, request: ArcoRequest) -> None:
        self.db.add(request)
        self.db.flush()


class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, entry: AuditLog) -> AuditLog:
        self.db.add(entry)
        self.db.flush()
        return entry

    def list_all(self, limit: int = 200) -> list[AuditLog]:
        return list(self.db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)))
