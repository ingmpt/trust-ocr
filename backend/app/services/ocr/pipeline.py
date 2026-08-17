"""Orquesta el pipeline completo de extracción (HU 1.2, 1.3):
preprocesamiento -> OCR -> clasificación -> reglas de extracción -> corrección LLM
-> ensamblado de resultado final con score de confianza por campo.
"""
from app.services.ocr.engine import get_ocr_engine
from app.services.ocr.extraction_rules import apply_extraction_rules, classify_document
from app.services.ocr.llm_correction import get_llm_corrector
from app.services.ocr.preprocessing import preprocess_image


class ExtractionPipelineResult:
    def __init__(self, document_type: str, fields: dict[str, dict]):
        self.document_type = document_type
        self.fields = fields


def run_extraction_pipeline(image_bytes: bytes) -> ExtractionPipelineResult:
    preprocessed_image = preprocess_image(image_bytes)

    ocr_engine = get_ocr_engine()
    ocr_lines = ocr_engine.run(preprocessed_image)
    raw_text = "\n".join(line.text for line in ocr_lines)

    document_type = classify_document(raw_text)
    rule_based_fields = apply_extraction_rules(document_type, raw_text)

    llm_corrector = get_llm_corrector()
    final_fields = llm_corrector.correct(raw_text, rule_based_fields)

    return ExtractionPipelineResult(document_type=document_type, fields=final_fields)
