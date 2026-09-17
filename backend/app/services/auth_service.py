"""Servicio de autenticación: registro, login y gestión de claves API (HU 2.1, 1.4, 4.1)."""
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_api_key,
    hash_api_key,
    hash_password,
    verify_password,
)
from app.models.enums import PlanCode
from app.models.subscription import Subscription
from app.models.user import ApiKey, User
from app.repositories.subscription_repository import PlanRepository, SubscriptionRepository
from app.repositories.user_repository import ApiKeyRepository, UserRepository
from app.services.email_service import send_verification_email

VERIFICATION_TOKEN_TTL_HOURS = 24


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.api_keys = ApiKeyRepository(db)
        self.plans = PlanRepository(db)
        self.subscriptions = SubscriptionRepository(db)

    def register(self, email: str, password: str) -> User:
        if self.users.get_by_email(email):
            raise HTTPException(status.HTTP_409_CONFLICT, "El correo electrónico ya está registrado.")

        verification_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_TOKEN_TTL_HOURS)
        user = self.users.create(
            email=email,
            password_hash=hash_password(password),
            verification_token=verification_token,
            verification_token_expires_at=expires_at,
        )
        self._assign_freemium_plan(user.id)
        self.db.commit()

        verification_link = f"{settings.frontend_origin}/verify-email?token={verification_token}"
        send_verification_email(user.email, verification_link)
        return user

    def verify_email(self, token: str) -> None:
        user = self.users.get_by_verification_token(token)
        if user is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Enlace de verificación inválido.")
        if user.verification_token_expires_at is not None and user.verification_token_expires_at < datetime.now(timezone.utc):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "El enlace de verificación expiró. Solicita uno nuevo.")

        user.email_verified = True
        user.verification_token = None
        user.verification_token_expires_at = None
        self.users.save(user)
        self.db.commit()

    def _assign_freemium_plan(self, user_id: uuid.UUID) -> Subscription:
        freemium_plan = self.plans.get_by_code(PlanCode.FREEMIUM.value)
        if freemium_plan is None:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Plan Freemium no configurado.")

        period_start = datetime.now(timezone.utc)
        subscription = Subscription(
            user_id=user_id,
            plan_id=freemium_plan.id,
            status="active",
            current_period_start=period_start,
            current_period_end=period_start + timedelta(days=30),
            pages_used=0,
        )
        return self.subscriptions.create(subscription)

    def login(self, email: str, password: str) -> tuple[User, str]:
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas.")
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Cuenta desactivada.")
        if not user.email_verified:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Debes verificar tu correo electrónico antes de iniciar sesión.")

        token = create_access_token(str(user.id))
        return user, token

    def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual es incorrecta.")
        user.password_hash = hash_password(new_password)
        self.users.save(user)
        self.db.commit()

    def change_email(self, user: User, new_email: str) -> None:
        if self.users.get_by_email(new_email):
            raise HTTPException(status.HTTP_409_CONFLICT, "El correo electrónico ya está en uso.")
        user.email = new_email
        self.users.save(user)
        self.db.commit()

    def create_api_key(self, user: User, name: str) -> tuple[ApiKey, str]:
        raw_key, key_hash = generate_api_key()
        api_key = self.api_keys.create(user_id=user.id, name=name, key_hash=key_hash, key_preview=raw_key[-8:])
        self.db.commit()
        return api_key, raw_key

    def revoke_api_key(self, user: User, api_key_id: uuid.UUID) -> None:
        api_key = self.api_keys.get_by_id_for_user(api_key_id, user.id)
        if api_key is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Clave API no encontrada.")
        api_key.revoked_at = datetime.now(timezone.utc)
        self.db.commit()

    def authenticate_api_key(self, raw_key: str) -> User:
        api_key = self.api_keys.get_by_hash(hash_api_key(raw_key))
        if api_key is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Clave API inválida o revocada.")
        user = self.users.get_by_id(api_key.user_id)
        if user is None or not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Cuenta desactivada.")
        return user
