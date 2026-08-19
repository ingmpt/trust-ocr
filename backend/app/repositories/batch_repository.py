"""Acceso a datos para Batch."""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.batch import Batch


class BatchRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, batch: Batch) -> Batch:
        self.db.add(batch)
        self.db.flush()
        return batch

    def get_by_id(self, batch_id: uuid.UUID) -> Batch | None:
        return self.db.get(Batch, batch_id)

    def get_by_id_for_user(self, batch_id: uuid.UUID, user_id: uuid.UUID) -> Batch | None:
        return self.db.scalar(select(Batch).where(Batch.id == batch_id, Batch.user_id == user_id))

    def list_for_user(self, user_id: uuid.UUID, limit: int = 20) -> list[Batch]:
        return list(self.db.scalars(select(Batch).where(Batch.user_id == user_id).order_by(Batch.created_at.desc()).limit(limit)))

    def save(self, batch: Batch) -> None:
        self.db.add(batch)
        self.db.flush()
