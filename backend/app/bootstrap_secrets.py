"""Fetch runtime secrets from Infisical and dump them as a shell-sourceable
env file, BEFORE the app process (uvicorn/celery) boots.

Activated only when SECRETS_PROVIDER=infisical (production Hetzner SaaS
node). Local/dev keeps reading ./backend/.env untouched via python-dotenv.

Bootstrap-only vars (must already be plain env vars — see docker-compose.prod.yml
/ .env.bootstrap — these are the credentials used to REACH Infisical, never
secrets themselves):
    SECRETS_PROVIDER=infisical
    INFISICAL_API_URL
    INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET   (Machine Identity, Universal Auth)
    INFISICAL_PROJECT_ID
    INFISICAL_ENVIRONMENT                            (prod | staging)

Este módulo se usa en DOS caminos, ambos comparten `fetch_secrets()`:
  1. Docker (docker-entrypoint.sh): invoca `main()` como script, que vuelca los
     secretos a un archivo que el shell luego "sourcea" antes de exec'ar
     uvicorn/celery.
  2. Ejecución directa (venv, sin Docker): `app.core.config` importa
     `apply_to_environ()` y la llama en el arranque del proceso Python, así el
     mismo flujo aplica corriendo `uvicorn` a mano en local.

Bootstrap-only vars (deben llegar como variables de entorno reales -antes de
que este módulo corra-, nunca como secretos gestionados por Infisical):
    SECRETS_PROVIDER=infisical
    INFISICAL_API_URL
    INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET   (Machine Identity, Universal Auth)
    INFISICAL_PROJECT_ID
    INFISICAL_ENVIRONMENT                            (dev | staging | prod)
"""
import os
import sys

REQUIRED = [
    "INFISICAL_API_URL",
    "INFISICAL_CLIENT_ID",
    "INFISICAL_CLIENT_SECRET",
    "INFISICAL_PROJECT_ID",
    "INFISICAL_ENVIRONMENT",
]

# Marca en el propio entorno para no volver a llamar a Infisical dos veces
# (p. ej. si el docker-entrypoint ya lo hizo antes de exec'ar el proceso Python).
_BOOTSTRAPPED_MARKER = "_INFISICAL_BOOTSTRAPPED"


def _check_required() -> None:
    missing = [key for key in REQUIRED if not os.environ.get(key)]
    if missing:
        raise RuntimeError(f"SECRETS_PROVIDER=infisical pero faltan variables bootstrap: {missing}")


def fetch_secrets() -> dict[str, str]:
    """Autentica contra Infisical (Machine Identity) y devuelve todos los
    secretos del proyecto/entorno indicado en las variables bootstrap.
    """
    _check_required()
    from infisical_sdk import InfisicalSDKClient

    client = InfisicalSDKClient(host=os.environ["INFISICAL_API_URL"])
    client.auth.universal_auth.login(
        client_id=os.environ["INFISICAL_CLIENT_ID"],
        client_secret=os.environ["INFISICAL_CLIENT_SECRET"],
    )
    secrets = client.secrets.list_secrets(
        project_id=os.environ["INFISICAL_PROJECT_ID"],
        environment_slug=os.environ["INFISICAL_ENVIRONMENT"],
        secret_path="/",
    )
    return {secret.secretKey: secret.secretValue for secret in secrets.secrets}


def apply_to_environ() -> None:
    """Descarga los secretos de Infisical y los inyecta en el entorno de ESTE
    proceso Python (usado cuando se corre uvicorn/celery directamente, sin
    pasar por docker-entrypoint.sh). Idempotente: no repite la llamada de red
    si ya se aplicó antes (p. ej. el entrypoint de Docker ya lo hizo).
    """
    if os.environ.get(_BOOTSTRAPPED_MARKER):
        return
    for key, value in fetch_secrets().items():
        os.environ[key] = value
    os.environ[_BOOTSTRAPPED_MARKER] = "1"


def main() -> int:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/.env.infisical"

    try:
        secrets = fetch_secrets()
    except RuntimeError as exc:
        print(f"Fatal: {exc}", file=sys.stderr)
        return 1

    with open(out_path, "w", encoding="utf-8") as f:
        for key, value in secrets.items():
            escaped = value.replace("'", "'\\''")
            f.write(f"export {key}='{escaped}'\n")
        f.write(f"export {_BOOTSTRAPPED_MARKER}=1\n")

    print(f"Cargados {len(secrets)} secretos desde Infisical ({os.environ['INFISICAL_ENVIRONMENT']}) -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
