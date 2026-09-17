"""Acceso a datos para User y ApiKey."""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import ApiKey, User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def get_by_verification_token(self, token: str) -> User | None:
        return self.db.scalar(select(User).where(User.verification_token == token))

    def create(self, email: str, password_hash: str, verification_token: str, verification_token_expires_at) -> User:
        user = User(
            email=email,
            password_hash=password_hash,
            verification_token=verification_token,
            verification_token_expires_at=verification_token_expires_at,
        )
        self.db.add(user)
        self.db.flush()
        return user

    def save(self, user: User) -> None:
        self.db.add(user)
        self.db.flush()


class ApiKeyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: uuid.UUID, name: str, key_hash: str, key_preview: str) -> ApiKey:
        api_key = ApiKey(user_id=user_id, name=name, key_hash=key_hash, key_preview=key_preview)
        self.db.add(api_key)
        self.db.flush()
        return api_key

    def list_for_user(self, user_id: uuid.UUID) -> list[ApiKey]:
        return list(self.db.scalars(select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc())))

    def get_by_hash(self, key_hash: str) -> ApiKey | None:
        return self.db.scalar(select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.revoked_at.is_(None)))

    def get_by_id_for_user(self, api_key_id: uuid.UUID, user_id: uuid.UUID) -> ApiKey | None:
        return self.db.scalar(select(ApiKey).where(ApiKey.id == api_key_id, ApiKey.user_id == user_id))
