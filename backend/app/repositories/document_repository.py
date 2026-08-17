"""Acceso a datos para Document y ExtractionResult."""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document, ExtractionResult


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, document: Document) -> Document:
        self.db.add(document)
        self.db.flush()
        return document

    def get_by_id(self, document_id: uuid.UUID) -> Document | None:
        return self.db.get(Document, document_id)

    def get_by_id_for_user(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Document | None:
        return self.db.scalar(select(Document).where(Document.id == document_id, Document.user_id == user_id))

    def list_recent_for_user(self, user_id: uuid.UUID, limit: int = 10) -> list[Document]:
        return list(
            self.db.scalars(
                select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc()).limit(limit)
            )
        )

    def save(self, document: Document) -> None:
        self.db.add(document)
        self.db.flush()

    def save_extraction_result(self, result: ExtractionResult) -> ExtractionResult:
        self.db.add(result)
        self.db.flush()
        return result

    def list_expired(self, now) -> list[Document]:
        return list(self.db.scalars(select(Document).where(Document.expires_at.is_not(None), Document.expires_at <= now)))
