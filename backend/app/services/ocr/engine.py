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
    def __init__(self):
        from paddleocr import PaddleOCR  # import diferido: dependencia pesada opcional

        # use_angle_cls=False: preprocess_image() ya hace deskew con OpenCV antes del OCR;
        # el clasificador de ángulo de PaddleOCR es un modelo extra redundante que también
        # contribuía al OOM del contenedor (memcg out of memory con mem_limit=1024m).
        self._ocr = PaddleOCR(use_angle_cls=False, lang="es", show_log=False)

    def run(self, image: np.ndarray) -> list[OCRLine]:
        raw_result = self._ocr.ocr(image, cls=False)
        lines: list[OCRLine] = []
        for block in raw_result or []:
            if block is None:
                continue
            for item in block:
                if item is None or len(item) < 2:
                    continue
                _box, text_score = item
                if text_score is None or len(text_score) < 2:
                    continue
                text, score = text_score
                lines.append(OCRLine(text=text, confidence=round(score * 100, 2)))
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
            logger.warning("paddleocr/paddlepaddle no instalados; usando MockOCREngine.")
            return MockOCREngine()
    return MockOCREngine()
