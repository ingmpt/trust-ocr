"""Servicio de Corrección/Estructuración vía LLM (Gemini Flash Lite), abstraído
detrás de una interfaz propia para permitir sustitución futura por modelo
autogestionado sin impactar el resto del pipeline (HU 1.2).
"""
import json
import logging

from app.core.config import settings

logger = logging.getLogger("trustocr.llm")

_CORRECTION_PROMPT = """Eres un asistente que limpia y corrige datos extraídos por OCR de documentos \
peruanos (SUNAT, DNI, tickets térmicos). Recibes texto crudo, posiblemente con errores de OCR \
(ej. "T0T4L: S/. 1O0.00"), y debes devolver únicamente un JSON con los campos corregidos y su \
valor normalizado, sin explicaciones adicionales.

Texto crudo:
{raw_text}

Campos detectados por reglas (a corregir/completar si es necesario):
{fields_json}
"""


class BaseLLMCorrector:
    def correct(self, raw_text: str, fields: dict[str, dict]) -> dict[str, dict]:
        raise NotImplementedError


class GeminiLLMCorrector(BaseLLMCorrector):
    def __init__(self):
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(settings.gemini_model)

    def correct(self, raw_text: str, fields: dict[str, dict]) -> dict[str, dict]:
        prompt = _CORRECTION_PROMPT.format(raw_text=raw_text, fields_json=json.dumps(fields, ensure_ascii=False))
        response = self._model.generate_content(prompt)
        try:
            return json.loads(response.text)
        except (json.JSONDecodeError, AttributeError):
            logger.warning("Respuesta LLM no parseable como JSON; se conservan los campos de reglas.")
            return fields


class MockLLMCorrector(BaseLLMCorrector):
    """Adaptador de desarrollo: no requiere API key de Gemini. Devuelve los campos
    de reglas sin modificar, para permitir probar el resto del pipeline en local."""

    def correct(self, raw_text: str, fields: dict[str, dict]) -> dict[str, dict]:
        return fields


def get_llm_corrector() -> BaseLLMCorrector:
    if settings.gemini_api_key:
        try:
            return GeminiLLMCorrector()
        except ImportError:
            logger.warning("google-generativeai no instalado; usando MockLLMCorrector.")
    return MockLLMCorrector()
