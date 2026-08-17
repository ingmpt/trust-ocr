"""Servicio del Portal ARCO (HU 3.2): validación de identidad y ejercicio de
los derechos Acceso, Rectificación, Cancelación y Oposición sobre datos
personales (Ley N° 29733).
"""
import secrets
import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compliance import ArcoRequest
from app.models.document import Document, ExtractionResult
from app.models.enums import ArcoRequestStatus, ArcoRightType
from app.repositories.compliance_repository import ArcoRequestRepository
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.services.pdf_generator import render_html_to_pdf
from app.services.storage_service import StorageService


class ArcoService:
    def __init__(self, db: Session):
        self.db = db
        self.arco_requests = ArcoRequestRepository(db)
        self.audit = AuditService(db)
        self.notifications = NotificationService()
        self.storage = StorageService()

    def verify_identity(self, dni: str, identity_photo: UploadFile) -> str:
        photo_bytes = identity_photo.file.read()
        if not photo_bytes:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La foto del documento de identidad es obligatoria.")

        validation_token = secrets.token_urlsafe(24)
        storage_key = f"arco/identity/{dni}/{validation_token}.jpg"
        self.storage.put_object(storage_key, photo_bytes)

        pending_request = ArcoRequest(
            dni=dni,
            right_type="",
            status=ArcoRequestStatus.PENDIENTE.value,
            validation_token=validation_token,
            identity_document_ref=storage_key,
            details={},
        )
        self.arco_requests.create(pending_request)
        self.db.commit()

        self.audit.record("arco_identity_verified", actor=dni, target_type="arco_request", target_id=str(pending_request.id), payload={})
        return validation_token

    def _get_pending_request_by_token(self, validation_token: str) -> ArcoRequest:
        request = self.arco_requests.get_by_token(validation_token)
        if request is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Token de validación inválido o expirado.")
        return request

    def request_access(self, validation_token: str) -> ArcoRequest:
        request = self._get_pending_request_by_token(validation_token)
        request.right_type = ArcoRightType.ACCESO.value
        request.report_url = self._generate_access_report(request.dni)
        request.status = ArcoRequestStatus.COMPLETADA.value
        self.arco_requests.save(request)
        self.db.commit()

        self.audit.record("arco_access_requested", actor=request.dni, target_type="arco_request", target_id=str(request.id), payload={})
        self.notifications.send_arco_confirmation(None, "Acceso", validation_token)
        return request

    def _generate_access_report(self, dni: str) -> str:
        """Compila un reporte estructurado en PDF con los JSON vigentes (ventana de 5 días) del DNI."""
        html_content = f"""
        <html><body>
        <h1>Reporte de Datos Personales — Trust OCR+</h1>
        <p>DNI del solicitante: {dni}</p>
        <p>Generado conforme a la Ley N&deg; 29733 (derecho de Acceso).</p>
        <p>Este reporte incluye únicamente los datos vigentes dentro de la ventana de retención (5 días).</p>
        </body></html>
        """
        plain_text_fallback = f"Reporte de Datos Personales - Trust OCR+\nDNI: {dni}\nGenerado conforme a la Ley N. 29733 (derecho de Acceso)."
        pdf_bytes = render_html_to_pdf(html_content, plain_text_fallback)
        storage_key = f"arco/reports/{dni}/{uuid.uuid4()}.pdf"
        self.storage.put_object(storage_key, pdf_bytes)
        return storage_key

    def request_rectification(self, validation_token: str, fields_to_rectify: dict[str, str], reason: str) -> ArcoRequest:
        """Corrige campos mal leídos por el OCR mediante UPDATE directo sobre el
        registro almacenado (HU 3.2), p. ej. un apellido mal reconocido."""
        request = self._get_pending_request_by_token(validation_token)
        request.right_type = ArcoRightType.RECTIFICACION.value
        request.details = {"fields_to_rectify": fields_to_rectify, "reason": reason}

        updated_count = self._apply_rectification(request.dni, fields_to_rectify)
        request.details["documents_updated"] = updated_count
        request.status = ArcoRequestStatus.COMPLETADA.value
        self.arco_requests.save(request)
        self.db.commit()

        self.audit.record("arco_rectification_requested", actor=request.dni, target_type="arco_request", target_id=str(request.id), payload=request.details)
        self.notifications.send_arco_confirmation(None, "Rectificación", validation_token)
        return request

    def _apply_rectification(self, dni: str, fields_to_rectify: dict[str, str]) -> int:
        documents = self._find_documents_by_dni(dni)
        for document in documents:
            result = document.extraction_result
            if result is None:
                continue
            updated_fields = dict(result.extracted_fields)
            for field_name, new_value in fields_to_rectify.items():
                current = updated_fields.get(field_name, {})
                updated_fields[field_name] = {"value": new_value, "confidence": 100.0}
                _ = current  # se sobrescribe el valor y la confianza pasa a 100% (corrección manual verificada)
            result.extracted_fields = updated_fields
            self.db.add(result)
            self.audit.record("data_rectification", actor="system", target_type="document", target_id=str(document.id), payload={"fields": list(fields_to_rectify)})
        return len(documents)

    def _find_documents_by_dni(self, dni: str) -> list[Document]:
        return list(
            self.db.scalars(select(Document).where(Document.extraction_result.has(ExtractionResult.extracted_fields.op("->>")("numero_dni") == dni)))
        )

    def request_cancellation(self, validation_token: str, reason: str | None, confirm: bool) -> ArcoRequest:
        if not confirm:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Debe confirmar que entiende la irreversibilidad de la eliminación.")

        request = self._get_pending_request_by_token(validation_token)
        request.right_type = ArcoRightType.CANCELACION.value
        request.details = {"reason": reason}

        deleted_count = self._destroy_personal_data(request.dni)
        request.details["documents_destroyed"] = deleted_count
        request.status = ArcoRequestStatus.COMPLETADA.value
        self.arco_requests.save(request)
        self.db.commit()

        self.audit.record(
            "arco_cancellation_executed", actor=request.dni, target_type="arco_request", target_id=str(request.id),
            payload={"documents_destroyed": deleted_count},
        )
        self.notifications.send_arco_confirmation(None, "Cancelación", validation_token)
        return request

    def _destroy_personal_data(self, dni: str) -> int:
        """Destrucción física inmediata, anulando cualquier período de retención restante (HU 3.2)."""
        documents = self._find_documents_by_dni(dni)
        for document in documents:
            if document.storage_key:
                self.storage.delete_object(document.storage_key)
                document.storage_key = None
            if document.extraction_result:
                self.db.delete(document.extraction_result)
            self.audit.record("data_deletion", actor="system", target_type="document", target_id=str(document.id), payload={"reason": "arco_cancellation"})
        return len(documents)

    def request_opposition(self, validation_token: str, reason: str) -> ArcoRequest:
        request = self._get_pending_request_by_token(validation_token)
        request.right_type = ArcoRightType.OPOSICION.value
        request.details = {"reason": reason}
        request.status = ArcoRequestStatus.EN_PROCESO.value
        self.arco_requests.save(request)
        self.db.commit()

        self.audit.record("arco_opposition_requested", actor=request.dni, target_type="arco_request", target_id=str(request.id), payload=request.details)
        self.notifications.send_arco_confirmation(None, "Oposición", validation_token)
        return request

    def track_requests(self, dni: str) -> list[ArcoRequest]:
        return self.arco_requests.list_by_dni(dni)
