"""Generador de PDF para el reporte ARCO de Acceso (HU 3.2).

Usa WeasyPrint cuando está instalado (requirements-pdf.txt). Si no está
disponible (p. ej. faltan las librerías nativas de GTK en Windows), cae a un
generador de PDF mínimo con fpdf-less approach: un PDF de texto plano válido,
para no bloquear el desarrollo local ni la demostración funcional del flujo.
"""
import logging

logger = logging.getLogger("trustocr.pdf")


def render_html_to_pdf(html_content: str, plain_text_fallback: str) -> bytes:
    try:
        from weasyprint import HTML

        return HTML(string=html_content).write_pdf()
    except ImportError:
        logger.warning("weasyprint no instalado; generando PDF de reemplazo en texto plano.")
        return _minimal_text_pdf(plain_text_fallback)


def _minimal_text_pdf(text: str) -> bytes:
    """Genera un PDF válido mínimo (sin dependencias) a partir de líneas de texto."""
    lines = text.strip().splitlines() or [""]
    content_stream = "BT /F1 12 Tf 50 750 Td 14 TL\n"
    for line in lines:
        escaped = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        content_stream += f"({escaped}) Tj T*\n"
    content_stream += "ET"

    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(content_stream)} >>\nstream\n{content_stream}\nendstream",
    ]

    pdf = "%PDF-1.4\n"
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf.encode("latin-1", errors="replace")))
        pdf += f"{index} 0 obj\n{obj}\nendobj\n"

    xref_offset = len(pdf.encode("latin-1", errors="replace"))
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for offset in offsets[1:]:
        pdf += f"{offset:010} 00000 n \n"
    pdf += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF"

    return pdf.encode("latin-1", errors="replace")
