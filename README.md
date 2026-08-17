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
- **Motor OCR**: interfaz abstracta con adaptador PaddleOCR (real, opcional) y adaptador `mock` (por defecto en local, sin dependencias pesadas de ML).
- **Corrección LLM**: interfaz abstracta con adaptador Gemini (real, opcional) y adaptador `mock` (por defecto en local, sin API key).
- **Almacenamiento**: cliente S3-compatible (boto3) contra Cloudflare R2; cae a almacenamiento en memoria si no hay credenciales configuradas (sólo desarrollo local).
- **Generación de PDF (reporte ARCO)**: WeasyPrint (real, opcional) con generador de PDF mínimo de reemplazo si no está instalado (evita dependencias nativas de GTK en Windows).
- **Autenticación**: JWT (sesión web) y claves API con hash SHA-256 (integraciones).
- **Registro de auditoría**: tabla append-only en PostgreSQL, con punto de extensión para firma externa (blockchain/sello de tiempo) — proveedor pendiente de selección según el documento técnico.

### Nota sobre dependencias pesadas/opcionales

Para evitar fallos de instalación en el entorno de desarrollo local, `requirements.txt` **no** incluye PaddleOCR/PaddlePaddle ni WeasyPrint por defecto:

- `requirements-ocr.txt`: instalar sólo para usar el motor OCR real (`OCR_ENGINE=paddleocr` en `.env`).
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

Revisar `.env` y completar credenciales reales sólo cuando se vayan a probar integraciones externas (Gemini, Cloudflare R2, Zoho, PaddleOCR/WeasyPrint). En modo local sin esas credenciales, la app funciona con los adaptadores mock/fallback.

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

Pendiente de probar con credenciales reales (fuera del alcance de este smoke test): Gemini, Cloudflare R2, Zoho SMTP, PaddleOCR, WeasyPrint.

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
- Integración real de Culqi, Nubefact, Gemini, Cloudflare R2, Zoho SMTP, PaddleOCR y WeasyPrint pendiente de credenciales/decisión de proveedor.
- Node.js no estaba instalado en el entorno; se instaló vía `winget install OpenJS.NodeJS.LTS` para poder construir el frontend.
