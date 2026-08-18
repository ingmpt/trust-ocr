---
name: trust-ocr-api-integration
description: Use when integrating with the Trust OCR+ document extraction API — uploading documents (individual or batch), retrieving extracted fields, managing templates, and handling authentication via API key. Covers the complete workflow from authentication through document processing to result retrieval.
---

# Trust OCR+ API Integration

## Authentication

Use the `X-API-Key` header with your API key (prefix `tocr_`).

```
X-API-Key: tocr_your_key_here
```

Generate keys from the web dashboard (Mi Cuenta → Claves API) or via:

```http
POST /api/v1/users/me/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{"name": "My Integration"}
```

The `raw_key` in the response is shown only once — store it securely.

## Base URL

```
https://api.trustocr.com/api/v1
```

Local development: `http://127.0.0.1:8000/api/v1`

## Core Workflow

1. Upload a document (with optional template selection)
2. Receive the extraction result immediately in the response
3. Use the extracted JSON fields in your system

### Upload a single document

```http
POST /api/v1/documents
X-API-Key: tocr_...
Content-Type: multipart/form-data

file: <binary>
processing_mode: "express"          # or "almacenado"
template_id: ""                     # optional UUID of a template
```

Response (201):
```json
{
  "id": "uuid",
  "status": "completed",
  "processing_mode": "express",
  "page_count": 1,
  "estimated_seconds": 1.5
}
```

### Retrieve extraction result

```http
GET /api/v1/documents/{document_id}
X-API-Key: tocr_...
```

Response:
```json
{
  "id": "uuid",
  "status": "completed",
  "processing_mode": "express",
  "document_type": "plantilla",
  "extracted_fields": {
    "ruc_emisor": {"value": "20537583046", "confidence": 95},
    "razon_social_emisor": {"value": "SEDAPAL", "confidence": 90},
    "importe_total": {"value": "656.00", "confidence": 95},
    "fecha_vencimiento": {"value": "20/09/2024", "confidence": 95}
  },
  "used_template": true,
  "error_message": null,
  "created_at": "2026-08-17T02:34:07Z",
  "completed_at": "2026-08-17T02:34:12Z",
  "expires_at": null
}
```

### Upload a batch (ZIP)

```http
POST /api/v1/documents/batch
X-API-Key: tocr_...
Content-Type: multipart/form-data

file: <zip_binary>
processing_mode: "express"
template_id: ""                     # optional; if set, applies to all docs in ZIP
```

Response (201):
```json
{
  "batch_id": "uuid",
  "document_ids": ["uuid1", "uuid2", "uuid3"],
  "total_documents": 3,
  "estimated_seconds": 2.4
}
```

Then retrieve each result individually via `GET /api/v1/documents/{id}`.

## Templates

Templates define which fields to extract. The system provides global templates (Factura SUNAT, Recibo de Agua, Luz, Gas) and users can create custom ones.

### List available templates

```http
GET /api/v1/templates
X-API-Key: tocr_...
```

### Processing behavior by template selection

| `template_id` value | Behavior |
|---|---|
| UUID of a template | Extracts only the fields defined in that template (1 Gemini call) |
| Empty / omitted | Auto-classifies against user's templates; if match found, uses it; if not, extracts all detectable fields via LLM |

## Processing Modes

| Mode | Data retention | Use case |
|---|---|---|
| `express` | Result available only during active session; images destroyed immediately | Real-time integrations, no data at rest |
| `almacenado` | Images + results retained 5 days, then physically deleted | Audit trail, re-processing |

## Supported File Formats

- Images: JPEG, PNG
- Documents: PDF (multi-page supported; each page = 1 credit)
- Batch: ZIP containing any of the above

## Credit System

- 1 credit = 1 image or 1 PDF page
- Multi-page PDFs consume N credits (N = page count)
- Check remaining credits: `GET /api/v1/subscriptions/me`
- When credits are exhausted: API returns `402 Payment Required`

## Error Handling

| Status | Meaning | Action |
|---|---|---|
| 401 | Invalid or revoked API key | Check/regenerate key |
| 402 | Credits exhausted | Upgrade plan or wait for cycle reset |
| 400 | Invalid file format or missing parameters | Check file type and required fields |
| 404 | Document not found or session expired (Express mode) | Document may have been processed in Express mode and session ended |
| 500 | Processing error | Retry; if persistent, check `error_message` in result |

## Gotchas

- Express mode results disappear when the session/token expires. For integrations that retrieve results later, use `almacenado` mode.
- The `template_id` field in multipart upload must be sent as a string (even though it's a UUID). Send empty string `""` to omit, not null.
- Batch processing is synchronous — the response returns only after ALL documents are processed. For large ZIPs (50+ files), expect proportional wait times.
- API keys authenticate the same user account that created them. Credits are deducted from that user's subscription.
- The `confidence` field ranges 0-100 (percentage). Fields below 60% may need manual verification.
- PDF rasterization renders at 200 DPI. Very small text on large-format documents may have lower OCR accuracy.

## Quick Start (Python)

```python
import requests

API_KEY = "tocr_your_key_here"
BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-API-Key": API_KEY}

# Upload and extract
with open("factura.pdf", "rb") as f:
    response = requests.post(
        f"{BASE_URL}/documents",
        headers=HEADERS,
        files={"file": f},
        data={"processing_mode": "express"},
    )
doc = response.json()

# Get result
result = requests.get(f"{BASE_URL}/documents/{doc['id']}", headers=HEADERS).json()
print(result["extracted_fields"])
```

## Quick Start (Node.js)

```javascript
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

const API_KEY = "tocr_your_key_here";
const BASE_URL = "http://127.0.0.1:8000/api/v1";

async function extractDocument(filePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("processing_mode", "express");

  const upload = await axios.post(`${BASE_URL}/documents`, form, {
    headers: { "X-API-Key": API_KEY, ...form.getHeaders() },
  });

  const result = await axios.get(`${BASE_URL}/documents/${upload.data.id}`, {
    headers: { "X-API-Key": API_KEY },
  });

  return result.data.extracted_fields;
}
```

## OpenAPI / Swagger

Full interactive documentation: `{BASE_URL}/../docs`
OpenAPI JSON spec: `{BASE_URL}/../openapi.json`
