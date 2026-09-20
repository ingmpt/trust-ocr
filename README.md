# Trust OCR+

Plataforma de digitalización y extracción de datos estructurados para documentos peruanos (SUNAT, DNI, tickets térmicos), con modelo de negocio Freemium, cumplimiento normativo (Ley N° 29733) y portal de autoservicio ARCO.

Este README se mantiene actualizado con el detalle funcional y técnico del proyecto a medida que avanza la construcción (ver Documento Técnico de Arquitectura, Backlog y Lineamientos UX/UI en la raíz del repositorio).

## Estado actual

**Backend (API) y Frontend construidos y probados localmente.** Ambos siguiendo el orden de trabajo "down-up": el frontend (React + Vite + TypeScript) se construyó al final, consumiendo la API ya funcional.

Épicas del Backlog cubiertas:

| Épica | Cobertura |
|---|---|
| 1. Gestión de Documentos y Extracción de Datos | Completa (carga individual/lote ZIP, pipeline OCR con adaptadores mock/real, reglas SUNAT/DNI/tickets, corrección LLM, ensamblado con confianza, autenticación por API key) |
| 2. Suscripciones y Facturación | Completa a nivel de dominio (planes, créditos, prorrateo, 402 Payment Required, pago por uso). Pasarela de pago (Culqi) y OSE (Nubefact) preparados pero **no integrados** en el MVP, según el documento técnico (lanzamiento Freemium sin cobro) |
| 3. Privacidad y Cumplimiento Normativo | Completa (modos Express/Almacenado, Portal ARCO con 4 derechos, registro de auditoría append-only) |
| 4. Administración de la Plataforma | Completa (perfil, cambio de contraseña/email, claves API) |

## Arquitectura y stack

Ver [`Documento Técnico de Arquitectura.md`](./Documento%20T%C3%A9cnico%20de%20Arquitectura.md) para el detalle completo de decisiones. Resumen de lo implementado:

- **API**: Python 3.12 + FastAPI, documentación OpenAPI automática en `/docs`.
- **Base de datos**: PostgreSQL + SQLAlchemy 2.0 + Alembic (migraciones).
- **Cache/sesión Express**: Redis.
- **Preprocesamiento de imagen**: OpenCV.
- **Motor OCR**: interfaz abstracta con adaptador ONNX Runtime (`rapidocr-onnxruntime`, modelos PP-OCRv3 de PaddleOCR — real, opcional) y adaptador `mock` (por defecto en local, sin dependencias pesadas de ML). Se migró desde el runtime nativo de PaddlePaddle en producción por un problema de memoria (ver "Decisiones técnicas y supuestos de esta entrega").
- **Corrección LLM**: interfaz abstracta con adaptador Gemini (real, opcional) y adaptador `mock` (por defecto en local, sin API key).
- **Almacenamiento**: cliente S3-compatible (boto3) contra Cloudflare R2; cae a almacenamiento en memoria si no hay credenciales configuradas (sólo desarrollo local).
- **Generación de PDF (reporte ARCO)**: WeasyPrint (real, opcional) con generador de PDF mínimo de reemplazo si no está instalado (evita dependencias nativas de GTK en Windows).
- **Autenticación**: JWT (sesión web) y claves API con hash SHA-256 (integraciones). Registro protegido con CAPTCHA (Cloudflare Turnstile) y verificación de correo obligatoria antes de poder iniciar sesión (ver detalle abajo).
- **Registro de auditoría**: tabla append-only en PostgreSQL, con punto de extensión para firma externa (blockchain/sello de tiempo) — proveedor pendiente de selección según el documento técnico.

### Registro de cuentas: CAPTCHA + verificación de correo (post-MVP, agregado en producción)

Para mitigar registro automatizado de cuentas por bots, se agregó al flujo de `POST /auth/register`:

- **CAPTCHA (Cloudflare Turnstile)**: el frontend renderiza el widget (`VITE_TURNSTILE_SITE_KEY`, público) y envía el token como `captcha_token`; el backend lo valida contra la API de Cloudflare usando `TURNSTILE_SECRET_KEY` (secreto de negocio, vía Infisical en prod). Si `TURNSTILE_SECRET_KEY` está vacío (desarrollo local), la verificación se omite — mismo patrón que los demás adaptadores opcionales (OCR/LLM/storage).
- **Verificación de correo obligatoria**: el registro ya no inicia sesión automáticamente. Se crea la cuenta con `email_verified=false`, se genera un token de verificación (válido 24h) y se envía un enlace (`{FRONTEND_ORIGIN}/verify-email?token=...`) por correo (Zoho SMTP). `POST /auth/login` rechaza con 403 si el correo no está verificado. Si `ZOHO_SMTP_USER`/`ZOHO_SMTP_PASSWORD` no están configurados, el enlace se registra en el log de la API (`docker compose logs api`) en vez de enviarse, para poder seguir probando sin el proveedor de correo activo.

Variables nuevas: `TURNSTILE_SECRET_KEY` (backend, secreto en Infisical) y `VITE_TURNSTILE_SITE_KEY` (frontend, público, build-time — ver `docker-compose.prod.yml` / `frontend/Dockerfile`).

### Nota sobre dependencias pesadas/opcionales

Para evitar fallos de instalación en el entorno de desarrollo local, `requirements.txt` **no** incluye PaddleOCR/PaddlePaddle ni WeasyPrint por defecto:

- `requirements-ocr.txt`: instalar sólo para usar el motor OCR real (`OCR_ENGINE=paddleocr` en `.env`; el nombre del flag se mantiene por compatibilidad, pero internamente ejecuta ONNX Runtime, no PaddlePaddle nativo).
- `requirements-pdf.txt`: instalar sólo para generar los reportes ARCO con WeasyPrint (requiere librerías nativas de GTK3 en Windows).

Mientras no se instalen, la aplicación funciona igual usando los adaptadores de reemplazo (mock OCR, corrección LLM sin cambios, PDF de texto plano mínimo).

## Estructura del proyecto

```
frontend/
  src/
    api/         # clientes tipados por dominio (auth, plans, documents, billing, arco)
    context/     # AuthContext (sesión JWT)
    components/  # Layout, ProtectedRoute, Alert
    pages/       # una carpeta por grupo de pantallas (auth, documents, plans, billing, account, arco)
backend/
  app/
    core/        # configuración, DB, Redis, seguridad (JWT, hashing, API keys)
    models/      # entidades SQLAlchemy (User, Plan, Subscription, Document, ArcoRequest, AuditLog, etc.)
    schemas/     # esquemas Pydantic de entrada/salida
    repositories/# acceso a datos (una clase por agregado)
    services/    # lógica de negocio (auth, créditos, planes, documentos, OCR pipeline, billing, ARCO, auditoría)
    api/v1/      # routers de FastAPI agrupados por dominio
    db/          # seed de catálogo de planes
  alembic/       # migraciones de base de datos
  requirements*.txt
  .env.example
docker-compose.yml  # Postgres + Redis para desarrollo local
```

## Puesta en marcha local

### 1. Requisitos
- Python 3.12+
- Docker (para Postgres y Redis locales)

### 2. Infraestructura local

```powershell
docker compose up -d
```

Levanta Postgres en `localhost:5433` (se remapeó desde 5432 para no chocar con instalaciones locales existentes) y Redis en `localhost:6379`.

### 3. Entorno Python

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
Copy-Item .env.example .env
```

**Flujo de secretos (Infisical):** todos los secretos de negocio (`SECRET_KEY`, `GEMINI_API_KEY`, `R2_*`, `ZOHO_*`, `AUDIT_SIGNING_API_KEY`, `CULQI_*`, `NUBEFACT_*`) se gestionan en Infisical, no en `.env`. En `.env` sólo se completan las credenciales "bootstrap" para autenticar contra Infisical:

```dotenv
SECRETS_PROVIDER=infisical
INFISICAL_API_URL=https://app.infisical.com
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=dev
```

La app descarga esos secretos de Infisical en el arranque (`app/bootstrap_secrets.py`, invocado desde `app/core/config.py`), tanto corriendo `uvicorn` directo desde el venv como dentro de Docker (`docker-entrypoint.sh`). Si `SECRETS_PROVIDER` falta alguna variable bootstrap, la app falla explícitamente al arrancar en vez de continuar sin secretos.

Fallback legado (sin Infisical, sólo para desarrollo puntual): dejar `SECRETS_PROVIDER` vacío y completar los valores reales directamente en `.env`. En modo local sin esas credenciales (ninguna de las dos opciones), la app funciona con los adaptadores mock/fallback (OCR, LLM, storage, PDF, correo).

### 4. Migraciones de base de datos

```powershell
.venv\Scripts\python -m alembic upgrade head
```

### 5. Levantar la API

```powershell
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

- Documentación interactiva: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

Al iniciar, la app siembra automáticamente el catálogo de planes (Freemium, Básico, Crecimiento, Corporativo) con los precios y cuotas del Backlog.

### 6. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

- La app queda disponible en `http://localhost:5173` (Vite elige el siguiente puerto libre si está ocupado, p. ej. `5174`).
- Si Vite usa un puerto distinto a 5173, actualizar `FRONTEND_ORIGIN` en `backend/.env` para que el CORS del backend lo acepte, y reiniciar la API.
- El Portal ARCO es público: accesible desde `/arco/identificacion` sin iniciar sesión (enlace visible en la pantalla de Login).

## Despliegue en producción (VPS con Traefik ya existente, IP pública 62.238.26.202)

Flujo **manual** (sin CI/CD a GHCR; el workflow `.github/workflows/deploy-production.yml` queda desactivado con `workflow_dispatch` como respaldo futuro). El servidor ya tiene Traefik corriendo y gestionando otras aplicaciones — este despliegue solo se conecta a esa red externa, no instala un Traefik nuevo.

### Primera vez (setup del servidor)

1. Confirmar que Docker está instalado y que existe la red externa que usa el Traefik ya corriendo en el servidor (por defecto se asume `traefik-public`; si el nombre real es otro, ajustar la sección `networks` y las labels `traefik.docker.network` en `docker-compose.prod.yml`).
2. Clonar el repo en `/opt/trust-ocr`.
3. Crear `/opt/trust-ocr/.env` a partir de [`.env.example`](./.env.example) (permisos `600`) con las credenciales reales de Machine Identity de Infisical y las contraseñas de Postgres/Redis.
4. DNS: apuntar `ocr.trustedtechnologyperu.com` y `app.trustedtechnologyperu.com` (registro A) a `62.238.26.202`.

### Cada despliegue

```bash
cd /opt/trust-ocr
git pull
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker compose -f docker-compose.prod.yml exec -T api alembic upgrade head
docker image prune -f
```

Docker Compose carga automáticamente el `.env` del mismo directorio (sustitución de variables + `env_file:` de cada servicio) — no hace falta pasar `--env-file`. `docker-compose.prod.yml` construye las imágenes de `api`/`celery-worker`/`celery-beat` desde `backend/Dockerfile` y de `frontend` desde `frontend/Dockerfile` directamente en el servidor (no usa registro externo). Todos los secretos de negocio (`SECRET_KEY`, `GEMINI_API_KEY`, `R2_*`, `ZOHO_*`, `AUDIT_SIGNING_API_KEY`, etc.) se descargan de Infisical en runtime; `.env` sólo trae las credenciales para autenticar contra Infisical y las de Postgres/Redis/Vite.

`alembic upgrade head` es obligatorio en cada despliegue (no solo el primero): el contenedor `postgres` arranca con una base de datos vacía, y el esquema (tablas `users`, `documents`, `subscriptions`, `audit_log`, etc.) solo se crea/actualiza aplicando las migraciones de [`backend/alembic/versions`](./backend/alembic/versions). Se corre dentro del contenedor `api` (ya tiene el código, dependencias y `DATABASE_URL` correctos) en vez de instalar Alembic en el host. Si no hay migraciones nuevas pendientes, el comando es idempotente y no hace nada — por eso es seguro dejarlo siempre en el flujo de despliegue.

**Nunca se commitea**: `.env`, `Infisical_secrets.txt` — excluidos explícitamente en [`.gitignore`](./.gitignore).

## Resultado de pruebas locales (smoke test manual)

Verificado manualmente contra la API y el frontend en ejecución:

- ✅ `POST /api/v1/auth/register` → asigna plan Freemium automáticamente.
- ✅ `GET /api/v1/subscriptions/me` → refleja plan, cuota y consumo.
- ✅ `POST /api/v1/documents` (modo Express) → pipeline completo (preprocesamiento → OCR mock → clasificación → reglas → corrección LLM mock → resultado en Redis) y descuento de crédito de página.
- ✅ `GET /api/v1/documents/{id}` → recupera el resultado JSON con campos y confianza.
- ✅ `POST /api/v1/arco/identity/verify` → genera token de validación.
- ✅ `POST /api/v1/arco/requests/access` → genera reporte PDF (fallback) y registra auditoría.
- ✅ `POST /api/v1/payment-methods` → registra método de pago (sin tokenización real, Culqi no integrado en MVP).
- ✅ Frontend: `npm run build` y `tsc -b --noEmit` sin errores; CORS verificado entre `localhost:5174` (frontend) y `localhost:8000` (backend); páginas cargan y consumen la API (Login, Registro, Dashboard, Carga de Documentos, Planes, ARCO).

Pendiente de probar con credenciales reales (fuera del alcance de este smoke test): Gemini, Cloudflare R2, Zoho SMTP, WeasyPrint. **OCR (ONNX Runtime/PP-OCRv3) ya validado en producción** con documentos reales (recibos SUNAT/SEDAPAL).

## Decisiones técnicas y supuestos de esta entrega

- El **Documento Técnico de Arquitectura** provisto está truncado (corta a mitad de frase en la descripción del Portal ARCO, sin llegar a las secciones de "Riesgos técnicos" ni "Decisiones pendientes"). Se construyó con base en las decisiones explícitas ya marcadas como "finales" en el documento, y en el Backlog/Lineamientos UX-UI, que sí están completos.
- El **proveedor de firma externa del registro de auditoría** (blockchain/sello de tiempo) no está seleccionado en el documento técnico; se implementó la interfaz de extensión (`AUDIT_SIGNING_PROVIDER`) sin integrar un proveedor real, siguiendo el mismo patrón usado para Culqi/Nubefact (preparado, no integrado).
- El **Portal ARCO** se implementó como frontend propio (confirmado con el sponsor), consistente con las pantallas específicas ya detalladas en Lineamientos UX-UI. La **Rectificación** aplica un `UPDATE` real sobre el campo almacenado (`ExtractionResult.extracted_fields`) asociado al DNI, y la **Cancelación** ejecuta destrucción física inmediata de archivos y filas asociadas — ambas acciones quedan registradas en el log de auditoría append-only.
- 1 crédito de página = 1 imagen o 1 PDF de una hoja (HU 2.1). El MVP actual trata cada archivo cargado como 1 página; el conteo de páginas reales de PDFs multi-hoja queda como mejora posterior (ver Pendientes).

## Pendientes / limitaciones conocidas

- Frontend cubre las pantallas principales de las 4 épicas (auth, dashboard, carga/resultados, planes, billing, cuenta, ARCO completo); pulido visual adicional y validación de accesibilidad con lectores de pantalla reales queda pendiente.
- Conteo real de páginas en PDF multi-hoja (actualmente 1 archivo = 1 página).
- Procesamiento por lote (ZIP) es síncrono en el request; migrar a cola Celery/Redis para lotes grandes con notificación asíncrona real.
- La purga de documentos vencidos ya tiene tarea Celery Beat definida (`app/workers/tasks.py`, diaria a las 3am), pero requiere levantar `celery -A app.workers.celery_app worker` y `celery -A app.workers.celery_app beat` en un proceso separado (no está incluido en `docker-compose.yml` de este MVP).
- Integración real de Culqi, Nubefact, Zoho SMTP y WeasyPrint pendiente de credenciales/decisión de proveedor. Gemini y OCR (ONNX Runtime/PP-OCRv3) ya integrados y validados en producción. Cloudflare R2 integrado pero con error de permisos pendiente de corregir (`AccessDenied` en modo Almacenado — credenciales/policy del bucket en Infisical).
- Node.js no estaba instalado en el entorno; se instaló vía `winget install OpenJS.NodeJS.LTS` para poder construir el frontend.
