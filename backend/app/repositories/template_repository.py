"""Acceso a datos para DocumentTemplate."""
import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.template import DocumentTemplate


class TemplateRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, template: DocumentTemplate) -> DocumentTemplate:
        self.db.add(template)
        self.db.flush()
        return template

    def get_by_id(self, template_id: uuid.UUID) -> DocumentTemplate | None:
        return self.db.get(DocumentTemplate, template_id)

    def list_for_user(self, user_id: uuid.UUID) -> list[DocumentTemplate]:
        """Devuelve plantillas globales (user_id=None) + las del usuario."""
        return list(
            self.db.scalars(
                select(DocumentTemplate)
                .where(or_(DocumentTemplate.user_id.is_(None), DocumentTemplate.user_id == user_id), DocumentTemplate.is_active.is_(True))
                .order_by(DocumentTemplate.user_id.is_(None).desc(), DocumentTemplate.name)
            )
        )

    def list_global(self) -> list[DocumentTemplate]:
        return list(
            self.db.scalars(
                select(DocumentTemplate).where(DocumentTemplate.user_id.is_(None), DocumentTemplate.is_active.is_(True)).order_by(DocumentTemplate.name)
            )
        )

    def save(self, template: DocumentTemplate) -> None:
        self.db.add(template)
        self.db.flush()
