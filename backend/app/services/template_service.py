"""Servicio de Plantillas de Documento: CRUD + extracción preliminar + clasificación automática."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.template import DocumentTemplate
from app.models.user import User
from app.repositories.template_repository import TemplateRepository
from app.services.ocr.llm_extraction import classify_and_extract_template, extract_all_fields, extract_template_fields


class TemplateService:
    def __init__(self, db: Session):
        self.db = db
        self.templates = TemplateRepository(db)

    def create_template(self, user: User, name: str, description: str, field_definitions: list[dict], is_global: bool = False) -> DocumentTemplate:
        template = DocumentTemplate(
            user_id=None if is_global else user.id,
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
        if template.user_id is None and user.role != "admin":
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
        if template.user_id is None and user.role != "admin":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Las plantillas globales no se pueden eliminar.")
        template.is_active = False
        self.templates.save(template)
        self.db.commit()

    # --- Administración de plantillas (HU 4.2) ---

    def create_draft_from_fields(self, user_id: uuid.UUID, fields: list[dict]) -> DocumentTemplate | None:
        """Crea una plantilla 'borrador' a partir de campos detectados en un documento sin
        coincidencia (extracción genérica). No participa en clasificación hasta ser aprobada.
        Evita duplicados si ya existe una plantilla (activa o borrador) con campos muy similares.
        """
        field_names = {f["name"] for f in fields if f.get("name")}
        if not field_names:
            return None

        for candidate in self.templates.list_candidates_for_dedup():
            candidate_names = {f.get("name") for f in candidate.field_definitions if f.get("name")}
            if not candidate_names:
                continue
            overlap = len(field_names & candidate_names) / len(field_names | candidate_names)
            if overlap >= 0.5:
                return None  # ya existe una plantilla suficientemente parecida

        template = DocumentTemplate(
            user_id=user_id,
            name="Plantilla sugerida (borrador)",
            description="Generada automáticamente a partir de un documento sin plantilla coincidente.",
            field_definitions=[{"name": f["name"], "label": f.get("label", f["name"])} for f in fields],
            is_draft=True,
        )
        self.templates.create(template)
        self.db.commit()
        return template

    def get_any_template(self, template_id: uuid.UUID) -> DocumentTemplate:
        """Obtiene una plantilla sin restricción de propietario (uso exclusivo de admins)."""
        template = self.templates.get_by_id(template_id)
        if template is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Plantilla no encontrada.")
        return template

    def list_drafts(self) -> list[DocumentTemplate]:
        return self.templates.list_drafts()

    def approve_draft(
        self,
        template_id: uuid.UUID,
        name: str | None,
        description: str | None,
        field_definitions: list[dict] | None,
        make_global: bool = True,
    ) -> DocumentTemplate:
        template = self.get_any_template(template_id)
        if not template.is_draft:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La plantilla no está en estado borrador.")
        if name is not None:
            template.name = name
        if description is not None:
            template.description = description
        if field_definitions is not None:
            template.field_definitions = field_definitions
        template.is_draft = False
        if make_global:
            template.user_id = None
        self.templates.save(template)
        self.db.commit()
        return template

    def reject_draft(self, template_id: uuid.UUID) -> None:
        template = self.get_any_template(template_id)
        if not template.is_draft:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La plantilla no está en estado borrador.")
        self.templates.delete(template)
        self.db.commit()

    def set_active(self, template_id: uuid.UUID, is_active: bool) -> DocumentTemplate:
        template = self.get_any_template(template_id)
        template.is_active = is_active
        self.templates.save(template)
        self.db.commit()
        return template

    def promote_to_global(self, template_id: uuid.UUID) -> DocumentTemplate:
        """Mueve una plantilla personal al catálogo global, disponible para todos los usuarios."""
        template = self.get_any_template(template_id)
        template.user_id = None
        self.templates.save(template)
        self.db.commit()
        return template

    def preview_extraction(self, ocr_text: str) -> list[dict]:
        """Extrae todos los campos detectables del texto OCR para que el usuario cure y cree una plantilla."""
        return extract_all_fields(ocr_text)

    def extract_with_template(self, ocr_text: str, template: DocumentTemplate) -> dict[str, dict]:
        """Extrae sólo los campos definidos en la plantilla."""
        return extract_template_fields(ocr_text, template.field_definitions)

    def auto_classify_and_extract(self, user: User, ocr_text: str) -> tuple[DocumentTemplate | None, dict[str, dict]]:
        """Clasifica el documento contra las plantillas del usuario y extrae sus campos
        en una sola llamada LLM (clasificación + extracción fusionadas)."""
        user_templates = self.templates.list_for_user(user.id)
        if not user_templates:
            return None, {}

        templates_data = [{"id": str(t.id), "name": t.name, "field_definitions": t.field_definitions} for t in user_templates]
        matched_id, confidence, fields = classify_and_extract_template(ocr_text, templates_data)

        if matched_id is None or confidence < 40:
            return None, {}

        template = self.templates.get_by_id(uuid.UUID(matched_id))
        if template is None:
            return None, {}

        return template, fields
