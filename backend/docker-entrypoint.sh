#!/bin/sh
# Runs before uvicorn/celery. If SECRETS_PROVIDER=infisical, fetches secrets
# from Infisical and sources them into this process' environment BEFORE
# exec'ing the real command (so pydantic-settings sees them at import time).
# Local/dev: SECRETS_PROVIDER unset -> no-op, falls through to plain .env.
set -eu

if [ "${SECRETS_PROVIDER:-}" = "infisical" ]; then
  ENV_FILE=/tmp/.env.infisical
  python -m app.bootstrap_secrets "$ENV_FILE"
  set -a
  . "$ENV_FILE"
  set +a
  rm -f "$ENV_FILE"
fi

exec "$@"
