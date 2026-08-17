"""Servicio de Plantillas de Documento: CRUD + extracción preliminar + clasificación automática."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.template import DocumentTemplate
from app.models.user import User
from app.repositories.template_repository import TemplateRepository
from app.services.ocr.llm_extraction import classify_document_template, extract_all_fields, extract_template_fields


class TemplateService:
    def __init__(self, db: Session):
        self.db = db
        self.templates = TemplateRepository(db)

    def create_template(self, user: User, name: str, description: str, field_definitions: list[dict]) -> DocumentTemplate:
        template = DocumentTemplate(
            user_id=user.id,
            name=name,
            description=description,
            field_definitions=field_definitions,
        )
        self.templates.create(template)
        self.db.commit()
        return template

    def list_templates(self, user: User) -> list[DocumentTemplate]:
        return self.templates.list_for_user(user.id)

    def get_template(self, user: User, template_id: uuid.UUID) -> DocumentTemplate:
        template = self.templates.get_by_id(template_id)
        if template is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Plantilla no encontrada.")
        if template.user_id is not None and template.user_id != user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes acceso a esta plantilla.")
        return template

    def update_template(self, user: User, template_id: uuid.UUID, name: str | None, description: str | None, field_definitions: list[dict] | None) -> DocumentTemplate:
        template = self.get_template(user, template_id)
        if template.user_id is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Las plantillas globales no se pueden modificar. Crea una copia personalizada.")
        if name is not None:
            template.name = name
        if description is not None:
            template.description = description
        if field_definitions is not None:
            template.field_definitions = field_definitions
        self.templates.save(template)
        self.db.commit()
        return template

    def delete_template(self, user: User, template_id: uuid.UUID) -> None:
        template = self.get_template(user, template_id)
        if template.user_id is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Las plantillas globales no se pueden eliminar.")
        template.is_active = False
        self.templates.save(template)
        self.db.commit()

    def preview_extraction(self, ocr_text: str) -> list[dict]:
        """Extrae todos los campos detectables del texto OCR para que el usuario cure y cree una plantilla."""
        return extract_all_fields(ocr_text)

    def extract_with_template(self, ocr_text: str, template: DocumentTemplate) -> dict[str, dict]:
        """Extrae sólo los campos definidos en la plantilla."""
        return extract_template_fields(ocr_text, template.field_definitions)

    def auto_classify_and_extract(self, user: User, ocr_text: str) -> tuple[DocumentTemplate | None, dict[str, dict]]:
        """Clasifica el documento contra las plantillas del usuario y extrae campos si hay coincidencia."""
        user_templates = self.templates.list_for_user(user.id)
        if not user_templates:
            return None, {}

        templates_data = [{"id": str(t.id), "name": t.name, "field_definitions": t.field_definitions} for t in user_templates]
        matched_id, confidence = classify_document_template(ocr_text, templates_data)

        if matched_id is None or confidence < 40:
            return None, {}

        template = self.templates.get_by_id(uuid.UUID(matched_id))
        if template is None:
            return None, {}

        fields = extract_template_fields(ocr_text, template.field_definitions)
        return template, fields
