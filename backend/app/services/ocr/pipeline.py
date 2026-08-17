"""Orquesta el pipeline completo de extracción (HU 1.2, 1.3):
preprocesamiento -> OCR -> clasificación -> reglas de extracción -> corrección LLM
-> ensamblado de resultado final con score de confianza por campo.

Soporta dos modos:
- Sin plantilla: OCR → reglas SUNAT → LLM correction (flujo original).
- Con plantilla: OCR → LLM extrae sólo los campos de la plantilla (flujo dinámico).
"""
from app.services.ocr.engine import get_ocr_engine
from app.services.ocr.extraction_rules import apply_extraction_rules, classify_document
from app.services.ocr.llm_correction import get_llm_corrector
from app.services.ocr.llm_extraction import extract_template_fields
from app.services.ocr.pdf_rasterizer import is_pdf, render_pdf_to_images
from app.services.ocr.preprocessing import preprocess_image


class ExtractionPipelineResult:
    def __init__(self, document_type: str, fields: dict[str, dict], raw_text: str = ""):
        self.document_type = document_type
        self.fields = fields
        self.raw_text = raw_text


def run_ocr(file_bytes: bytes) -> str:
    """Ejecuta sólo OCR (preprocesamiento + reconocimiento) y devuelve el texto crudo."""
    page_images = render_pdf_to_images(file_bytes) if is_pdf(file_bytes) else [file_bytes]
    ocr_engine = get_ocr_engine()
    raw_text_parts: list[str] = []
    for page_image_bytes in page_images:
        preprocessed_image = preprocess_image(page_image_bytes)
        ocr_lines = ocr_engine.run(preprocessed_image)
        raw_text_parts.append("\n".join(line.text for line in ocr_lines))
    return "\n".join(raw_text_parts)


def run_extraction_pipeline(file_bytes: bytes, template_fields: list[dict] | None = None) -> ExtractionPipelineResult:
    raw_text = run_ocr(file_bytes)

    if template_fields:
        extracted = extract_template_fields(raw_text, template_fields)
        return ExtractionPipelineResult(document_type="plantilla", fields=extracted, raw_text=raw_text)

    document_type = classify_document(raw_text)
    rule_based_fields = apply_extraction_rules(document_type, raw_text)

    llm_corrector = get_llm_corrector()
    final_fields = llm_corrector.correct(raw_text, rule_based_fields)

    return ExtractionPipelineResult(document_type=document_type, fields=final_fields, raw_text=raw_text)

