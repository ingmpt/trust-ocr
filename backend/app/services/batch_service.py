"""Servicio de Carga Masiva (Batch) — procesamiento asíncrono vía Celery.

Flujo: el usuario sube un ZIP → se almacena → se crea un registro Batch con status
"pending" → se encola la tarea Celery → el usuario recibe batch_id al instante →
consulta el estado después o recibe notificación al completar.
"""
import uuid
import zipfile
from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.user import User
from app.repositories.batch_repository import BatchRepository
from app.services.storage_service import StorageService

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


class BatchService:
    def __init__(self, db: Session):
        self.db = db
        self.batches = BatchRepository(db)
        self.storage = StorageService()

    def submit_batch(self, user: User, zip_file: UploadFile, processing_mode: str, template_id: uuid.UUID | None = None) -> Batch:
        content = zip_file.file.read()

        try:
            with zipfile.ZipFile(BytesIO(content)) as archive:
                entries = [n for n in archive.namelist() if not n.endswith("/")]
                valid_files = [n for n in entries if "." in n and ("." + n.rsplit(".", 1)[-1].lower()) in SUPPORTED_EXTENSIONS]
        except zipfile.BadZipFile:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "El archivo no es un ZIP válido.")

        if not valid_files:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "El ZIP no contiene archivos soportados (JPEG, PNG, PDF).")

        storage_key = f"batches/{user.id}/{uuid.uuid4()}.zip"
        self.storage.put_object(storage_key, content)

        batch = Batch(
            user_id=user.id,
            status="pending",
            processing_mode=processing_mode,
            template_id=template_id,
            total_files=len(valid_files),
            storage_key=storage_key,
        )
        self.batches.create(batch)
        self.db.commit()

        from app.workers.tasks import process_batch_task
        process_batch_task.delay(str(batch.id))

        return batch

    def get_batch(self, user: User, batch_id: uuid.UUID) -> Batch:
        batch = self.batches.get_by_id_for_user(batch_id, user.id)
        if batch is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Lote no encontrado.")
        return batch

    def list_batches(self, user: User, limit: int = 20) -> list[Batch]:
        return self.batches.list_for_user(user.id, limit)
