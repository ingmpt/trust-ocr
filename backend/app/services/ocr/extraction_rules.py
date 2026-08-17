"""Motor de Reglas de Extracción Estructurada (HU 1.2): parsing determinístico
para documentos de estructura conocida (SUNAT, DNI, tickets térmicos),
incluida la validación algorítmica del dígito verificador del RUC.
"""
import re

from app.models.enums import DocumentType

_RUC_FACTOR_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

_PATTERNS = {
    "ruc": re.compile(r"\bRUC\s*[:\-]?\s*(\d{11})\b", re.IGNORECASE),
    "serie_correlativo": re.compile(r"\b([A-Z]{1,4}\d{1,4}\s*-\s*\d{1,10})\b"),
    "monto_total": re.compile(r"\b(?:TOTAL|IMPORTE TOTAL)\s*[:\-]?\s*S/\.?\s*([\d,]+\.\d{2})\b", re.IGNORECASE),
    "igv": re.compile(r"\bIGV\s*[:\-]?\s*S/\.?\s*([\d,]+\.\d{2})\b", re.IGNORECASE),
    "dni": re.compile(r"\bDNI\s*[:\-]?\s*(\d{8})\b", re.IGNORECASE),
    "fecha": re.compile(r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b"),
}


def validate_ruc_check_digit(ruc: str) -> bool:
    """Valida el dígito verificador del RUC de 11 dígitos (HU 1.2)."""
    if len(ruc) != 11 or not ruc.isdigit():
        return False

    digits = [int(d) for d in ruc[:10]]
    check_digit = int(ruc[10])
    total = sum(d * w for d, w in zip(digits, _RUC_FACTOR_WEIGHTS))
    remainder = 11 - (total % 11)
    expected = {10: 0, 11: 1}.get(remainder, remainder)
    return expected == check_digit


def classify_document(raw_text: str) -> str:
    text_upper = raw_text.upper()
    if "FACTURA" in text_upper and "RUC" in text_upper:
        return DocumentType.SUNAT_FACTURA.value
    if "BOLETA" in text_upper:
        return DocumentType.SUNAT_BOLETA.value
    if "GUIA" in text_upper and "REMISION" in text_upper:
        return DocumentType.SUNAT_GUIA_REMISION.value
    if "DOCUMENTO NACIONAL DE IDENTIDAD" in text_upper or re.search(r"\bDNI\b", text_upper):
        return DocumentType.DNI_ELECTRONICO.value
    if any(keyword in text_upper for keyword in ("GRIFO", "SUPERMERCADO", "TICKET")):
        return DocumentType.TICKET_TERMICO.value
    return DocumentType.DESCONOCIDO.value


def extract_sunat_fields(raw_text: str) -> dict[str, dict]:
    fields: dict[str, dict] = {}

    ruc_match = _PATTERNS["ruc"].search(raw_text)
    if ruc_match:
        ruc_value = ruc_match.group(1)
        confidence = 99.0 if validate_ruc_check_digit(ruc_value) else 40.0
        fields["ruc_emisor"] = {"value": ruc_value, "confidence": confidence}

    for field_name, pattern_key in (
        ("serie_correlativo", "serie_correlativo"),
        ("monto_total", "monto_total"),
        ("igv", "igv"),
    ):
        match = _PATTERNS[pattern_key].search(raw_text)
        if match:
            fields[field_name] = {"value": match.group(1), "confidence": 95.0}

    return fields


def extract_dni_fields(raw_text: str) -> dict[str, dict]:
    fields: dict[str, dict] = {}
    dni_match = _PATTERNS["dni"].search(raw_text)
    if dni_match:
        fields["numero_dni"] = {"value": dni_match.group(1), "confidence": 96.0}
    return fields


def extract_ticket_fields(raw_text: str) -> dict[str, dict]:
    fields: dict[str, dict] = {}
    fecha_match = _PATTERNS["fecha"].search(raw_text)
    if fecha_match:
        fields["fecha"] = {"value": fecha_match.group(1), "confidence": 85.0}
    monto_match = _PATTERNS["monto_total"].search(raw_text)
    if monto_match:
        fields["monto_total"] = {"value": monto_match.group(1), "confidence": 80.0}
    return fields


def apply_extraction_rules(document_type: str, raw_text: str) -> dict[str, dict]:
    if document_type in (
        DocumentType.SUNAT_FACTURA.value,
        DocumentType.SUNAT_BOLETA.value,
        DocumentType.SUNAT_GUIA_REMISION.value,
    ):
        return extract_sunat_fields(raw_text)
    if document_type in (DocumentType.DNI_AZUL.value, DocumentType.DNI_ELECTRONICO.value):
        return extract_dni_fields(raw_text)
    if document_type == DocumentType.TICKET_TERMICO.value:
        return extract_ticket_fields(raw_text)
    return {}
