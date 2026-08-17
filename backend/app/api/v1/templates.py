"""Endpoints de Plantillas de Documento y Extracción Preliminar."""
import uuid

from fastapi import APIRouter, File, Form, UploadFile, status

from app.api.deps import CurrentUserAny, DbSession
from app.schemas.template import ExtractedFieldPreview, TemplateCreate, TemplateRead, TemplateUpdate
from app.services.ocr.pipeline import run_ocr
from app.services.ocr.pdf_rasterizer import is_pdf
from app.services.template_service import TemplateService

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateRead])
def list_templates(user: CurrentUserAny, db: DbSession):
    return TemplateService(db).list_templates(user)


@router.post("", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreate, user: CurrentUserAny, db: DbSession):
    return TemplateService(db).create_template(
        user, payload.name, payload.description, [f.model_dump() for f in payload.field_definitions]
    )


@router.get("/{template_id}", response_model=TemplateRead)
def get_template(template_id: uuid.UUID, user: CurrentUserAny, db: DbSession):
    return TemplateService(db).get_template(user, template_id)


@router.put("/{template_id}", response_model=TemplateRead)
def update_template(template_id: uuid.UUID, payload: TemplateUpdate, user: CurrentUserAny, db: DbSession):
    return TemplateService(db).update_template(
        user, template_id, payload.name, payload.description,
        [f.model_dump() for f in payload.field_definitions] if payload.field_definitions else None,
    )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: uuid.UUID, user: CurrentUserAny, db: DbSession):
    TemplateService(db).delete_template(user, template_id)


@router.post("/preview-extraction", response_model=list[ExtractedFieldPreview])
def preview_extraction(user: CurrentUserAny, db: DbSession, file: UploadFile = File(...)):
    """Sube un documento, ejecuta OCR + LLM y devuelve todos los campos detectados para que el usuario seleccione cuáles guardar en la plantilla."""
    content = file.file.read()
    ocr_text = run_ocr(content)
    raw_fields = TemplateService(db).preview_extraction(ocr_text)
    return [
        ExtractedFieldPreview(
            name=f.get("name", "campo_desconocido"),
            label=f.get("label", f.get("name", "Campo")),
            value=f.get("value"),
            confidence=f.get("confidence", 0),
        )
        for f in raw_fields
    ]


@router.post("/from-result", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template_from_result(payload: TemplateCreate, user: CurrentUserAny, db: DbSession):
    """Crea una plantilla a partir de los campos de un resultado de extracción ya procesado."""
    return TemplateService(db).create_template(
        user, payload.name, payload.description, [f.model_dump() for f in payload.field_definitions]
    )
