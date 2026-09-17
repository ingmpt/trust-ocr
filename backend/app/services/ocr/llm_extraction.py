"""Extracción dinámica de campos vía Gemini (modelo barato: gemini-1.5-flash-8b).

Tres capacidades:
1. extract_all_fields: extrae TODOS los campos clave-valor de un texto OCR (para curación de plantilla).
2. extract_template_fields: extrae sólo los campos definidos en una plantilla.
3. classify_template: dado un texto OCR y una lista de plantillas, elige la más parecida.
"""
import json
import logging

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger("trustocr.llm_extract")

_EXTRACT_ALL_PROMPT = """Eres un sistema de extracción de datos de documentos escaneados.
Recibes texto crudo extraído por OCR de un documento peruano (recibo de servicio, factura, boleta, etc).

Tu tarea: identifica TODOS los campos relevantes del documento y devuélvelos como un JSON.
Cada campo debe tener: "name" (nombre técnico en snake_case), "label" (nombre legible en español),
"value" (el valor extraído del texto), "confidence" (0-100, qué tan seguro estás).

No inventes datos. Si un campo está parcialmente legible, extráelo con confianza baja.
Responde ÚNICAMENTE con el JSON (array de objetos), sin explicaciones.

Texto OCR del documento:
{ocr_text}
"""

_EXTRACT_TEMPLATE_PROMPT = """Eres un sistema de extracción de datos de documentos escaneados.
Recibes texto crudo extraído por OCR y una lista de campos específicos a extraer.

Campos a extraer:
{field_definitions}

Texto OCR del documento:
{ocr_text}

Responde ÚNICAMENTE con un JSON objeto donde cada clave es el "name" del campo y el valor es
un objeto con "value" (string o número extraído) y "confidence" (0-100).
Si un campo no se encuentra en el texto, ponlo con value=null y confidence=0.
"""

_CLASSIFY_PROMPT = """Eres un clasificador de documentos. Recibes texto OCR de un documento y
una lista de plantillas disponibles con sus nombres y campos esperados.

Plantillas disponibles:
{templates_json}

Texto OCR del documento (primeras 500 palabras):
{ocr_text}

Responde ÚNICAMENTE con el JSON: {{"template_id": "<id de la plantilla más parecida>", "confidence": <0-100>}}
Si ninguna plantilla coincide razonablemente (confianza < 40), responde: {{"template_id": null, "confidence": 0}}
"""

_CLASSIFY_AND_EXTRACT_PROMPT = """Eres un sistema de clasificación y extracción de datos de documentos
escaneados peruanos. Recibes el texto OCR de un documento y una lista de plantillas
disponibles con sus campos.

Plantillas disponibles:
{templates_json}

Texto OCR del documento:
{ocr_text}

Tarea (en un solo paso):
1. Elige la plantilla que mejor corresponda al documento. Si ninguna coincide
   razonablemente (confianza < 40), usa template_id=null y fields={{}}.
2. Si eliges una plantilla, extrae CADA uno de sus campos definidos a partir del
   texto OCR. No inventes datos: si un campo no aparece en el texto, value=null y confidence=0.

Responde ÚNICAMENTE con un JSON con esta forma exacta:
{{"template_id": "<id o null>", "confidence": <0-100>, "fields": {{"<nombre_campo>": {{"value": <valor o null>, "confidence": <0-100>}}}}}}
"""


def _get_model():
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(settings.gemini_model)


def _parse_json_response(text: str):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)


def extract_all_fields(ocr_text: str) -> list[dict]:
    """Extrae todos los campos detectables del texto OCR. Usado para curación de plantilla."""
    model = _get_model()
    response = model.generate_content(_EXTRACT_ALL_PROMPT.format(ocr_text=ocr_text))
    try:
        fields = _parse_json_response(response.text)
        if isinstance(fields, list):
            return fields
        return []
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Respuesta LLM no parseable en extract_all_fields.")
        return []


def extract_template_fields(ocr_text: str, field_definitions: list[dict]) -> dict[str, dict]:
    """Extrae sólo los campos definidos en la plantilla del usuario."""
    model = _get_model()
    fields_desc = json.dumps(field_definitions, ensure_ascii=False)
    response = model.generate_content(_EXTRACT_TEMPLATE_PROMPT.format(ocr_text=ocr_text, field_definitions=fields_desc))
    try:
        result = _parse_json_response(response.text)
        if isinstance(result, dict):
            return result
        return {}
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Respuesta LLM no parseable en extract_template_fields.")
        return {}


def classify_document_template(ocr_text: str, templates: list[dict]) -> tuple[str | None, float]:
    """Clasifica el documento contra las plantillas disponibles. Retorna (template_id, confidence)."""
    if not templates:
        return None, 0.0

    model = _get_model()
    templates_json = json.dumps(
        [{"id": t["id"], "name": t["name"], "fields": [f["name"] for f in t["field_definitions"]]} for t in templates],
        ensure_ascii=False,
    )
    truncated_text = " ".join(ocr_text.split()[:500])
    response = model.generate_content(_CLASSIFY_PROMPT.format(templates_json=templates_json, ocr_text=truncated_text))
    try:
        result = _parse_json_response(response.text)
        return result.get("template_id"), result.get("confidence", 0)
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Respuesta LLM no parseable en classify_document_template.")
        return None, 0.0


def classify_and_extract_template(ocr_text: str, templates: list[dict]) -> tuple[str | None, float, dict[str, dict]]:
    """Clasifica el documento y extrae sus campos en UNA sola llamada al LLM
    (evita el round-trip extra de clasificar y luego extraer por separado)."""
    if not templates:
        return None, 0.0, {}

    model = _get_model()
    templates_json = json.dumps(
        [{"id": t["id"], "name": t["name"], "field_definitions": t["field_definitions"]} for t in templates],
        ensure_ascii=False,
    )
    response = model.generate_content(_CLASSIFY_AND_EXTRACT_PROMPT.format(templates_json=templates_json, ocr_text=ocr_text))
    try:
        result = _parse_json_response(response.text)
        fields = result.get("fields") or {}
        if not isinstance(fields, dict):
            fields = {}
        return result.get("template_id"), result.get("confidence", 0), fields
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Respuesta LLM no parseable en classify_and_extract_template.")
        return None, 0.0, {}
