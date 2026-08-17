"""Servicio de Almacenamiento y Purga sobre Cloudflare R2 (S3-compatible) (HU 3.1, 3.2).

Usa boto3 como cliente S3-compatible contra el endpoint de R2 (decisión final
del sponsor). Si no hay credenciales configuradas (desarrollo local), cae a un
adaptador en memoria para no requerir infraestructura externa.
"""
import io
import logging
from datetime import datetime, timedelta, timezone

import boto3
from botocore.config import Config

from app.core.config import settings

logger = logging.getLogger("trustocr.storage")

_local_memory_store: dict[str, bytes] = {}


class StorageService:
    def __init__(self):
        self._use_memory = not (settings.r2_access_key_id and settings.r2_secret_access_key and settings.r2_endpoint_url)
        if not self._use_memory:
            self._client = boto3.client(
                "s3",
                endpoint_url=settings.r2_endpoint_url,
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                config=Config(signature_version="s3v4"),
                region_name="auto",
            )

    def put_object(self, key: str, data: bytes) -> str:
        if self._use_memory:
            logger.info("R2 no configurado; almacenando '%s' en memoria (sólo desarrollo local).", key)
            _local_memory_store[key] = data
            return key
        self._client.put_object(Bucket=settings.r2_bucket_name, Key=key, Body=data)
        return key

    def get_object(self, key: str) -> bytes | None:
        if self._use_memory:
            return _local_memory_store.get(key)
        response = self._client.get_object(Bucket=settings.r2_bucket_name, Key=key)
        return response["Body"].read()

    def delete_object(self, key: str) -> None:
        if self._use_memory:
            _local_memory_store.pop(key, None)
            return
        self._client.delete_object(Bucket=settings.r2_bucket_name, Key=key)

    def compute_expiration(self) -> datetime:
        """Fecha de eliminación física para modo 'Almacenado' (retención de 5 días, HU 3.1)."""
        return datetime.now(timezone.utc) + timedelta(days=settings.storage_retention_days)
