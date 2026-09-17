"""Endpoints de administración de plantillas (HU 4.2): revisión de borradores
sugeridos automáticamente y control del catálogo global. Restringido a rol admin.
"""
import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentAdminUser, DbSession
from app.schemas.template import TemplateActiveUpdate, TemplateDraftApprove, TemplateRead
from app.services.template_service import TemplateService

router = APIRouter(prefix="/admin/templates", tags=["admin-templates"])


@router.get("/drafts", response_model=list[TemplateRead])
def list_drafts(admin: CurrentAdminUser, db: DbSession):
    return TemplateService(db).list_drafts()


@router.post("/drafts/{template_id}/approve", response_model=TemplateRead)
def approve_draft(template_id: uuid.UUID, payload: TemplateDraftApprove, admin: CurrentAdminUser, db: DbSession):
    return TemplateService(db).approve_draft(
        template_id,
        payload.name,
        payload.description,
        [f.model_dump() for f in payload.field_definitions] if payload.field_definitions else None,
        payload.make_global,
    )


@router.delete("/drafts/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def reject_draft(template_id: uuid.UUID, admin: CurrentAdminUser, db: DbSession):
    TemplateService(db).reject_draft(template_id)


@router.patch("/{template_id}/active", response_model=TemplateRead)
def set_active(template_id: uuid.UUID, payload: TemplateActiveUpdate, admin: CurrentAdminUser, db: DbSession):
    return TemplateService(db).set_active(template_id, payload.is_active)


@router.patch("/{template_id}/promote-global", response_model=TemplateRead)
def promote_to_global(template_id: uuid.UUID, admin: CurrentAdminUser, db: DbSession):
    return TemplateService(db).promote_to_global(template_id)
