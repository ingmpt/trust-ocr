"""Motor OCR (HU 1.2). Adaptador desacoplado: PaddleOCR (decisión final del sponsor)
o un adaptador "mock" para desarrollo local sin las dependencias pesadas de ML
(ver OCR_ENGINE en .env). Ambos exponen la misma interfaz OCRLine.
"""
import logging
from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from app.core.config import settings

logger = logging.getLogger("trustocr.ocr")


@dataclass
class OCRLine:
    text: str
    confidence: float  # 0-100


class BaseOCREngine:
    def run(self, image: np.ndarray) -> list[OCRLine]:
        raise NotImplementedError


class PaddleOCREngine(BaseOCREngine):
    """Motor real via ONNX Runtime (rapidocr-onnxruntime, mismos modelos PP-OCRv3 que
    PaddleOCR). Se migro desde PaddlePaddle nativo porque su allocador escalaba el uso
    de RAM proporcional al mem_limit del contenedor, causando OOM inevitable en la VPS.
    """

    def __init__(self):
        from rapidocr_onnxruntime import RapidOCR  # import diferido: dependencia pesada opcional

        self._ocr = RapidOCR()

    def run(self, image: np.ndarray) -> list[OCRLine]:
        result, _ = self._ocr(image)
        lines: list[OCRLine] = []
        for box_text_score in result or []:
            _box, text, score = box_text_score
            lines.append(OCRLine(text=text, confidence=round(float(score) * 100, 2)))
        return lines


class MockOCREngine(BaseOCREngine):
    """Adaptador de desarrollo: no requiere modelos de ML instalados.

    Devuelve una línea fija de alta confianza para permitir probar el resto
    del pipeline (reglas de extracción, LLM, ensamblado) en local.
    """

    def run(self, image: np.ndarray) -> list[OCRLine]:
        return [OCRLine(text="[OCR_MOCK] documento de prueba sin motor OCR real instalado", confidence=99.0)]


@lru_cache
def get_ocr_engine() -> BaseOCREngine:
    if settings.ocr_engine == "paddleocr":
        try:
            return PaddleOCREngine()
        except ImportError:
            logger.warning("rapidocr-onnxruntime no instalado; usando MockOCREngine.")
            return MockOCREngine()
    return MockOCREngine()
