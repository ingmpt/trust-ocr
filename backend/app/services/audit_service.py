"""Servicio de Registro de Auditoría inmutable (HU 3.3).

El registro base es append-only en PostgreSQL. La firma con sello de tiempo y
hash en blockchain de un proveedor externo está prevista en la arquitectura,
pero el proveedor específico queda "pendiente de selección" según el
documento técnico. Mientras tanto, AUDIT_SIGNING_PROVIDER=none deja
external_signature/external_hash en null y la integridad depende únicamente
del log append-only de PostgreSQL (personal autorizado, sin UPDATE/DELETE
expuestos por la API).
"""
import hashlib
import json
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.compliance import AuditLog
from app.repositories.compliance_repository import AuditLogRepository

logger = logging.getLogger("trustocr.audit")


class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_logs = AuditLogRepository(db)

    def record(self, event_type: str, actor: str, target_type: str, target_id: str, payload: dict) -> AuditLog:
        external_signature, external_hash = self._sign_externally(event_type, actor, target_type, target_id, payload)
        entry = AuditLog(
            event_type=event_type,
            actor=actor,
            target_type=target_type,
            target_id=target_id,
            payload=payload,
            external_signature=external_signature,
            external_hash=external_hash,
        )
        self.audit_logs.create(entry)
        self.db.commit()
        return entry

    def _sign_externally(self, event_type: str, actor: str, target_type: str, target_id: str, payload: dict) -> tuple[str | None, str | None]:
        content = json.dumps({"event_type": event_type, "actor": actor, "target_type": target_type, "target_id": target_id, "payload": payload}, sort_keys=True)
        local_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        if settings.audit_signing_provider == "none":
            return None, local_hash

        # Punto de extensión: al seleccionarse el proveedor de sellado/blockchain,
        # implementar aquí la llamada real a su API usando settings.audit_signing_api_key.
        logger.warning("Proveedor de firma de auditoría '%s' no implementado; usando sólo hash local.", settings.audit_signing_provider)
        return None, local_hash
