"""Conversión de PDF a imagen antes del pipeline OCR (HU 1.1, 1.2): PaddleOCR/OpenCV
operan sobre imágenes rasterizadas, no sobre el PDF original.
"""
import fitz  # PyMuPDF

PDF_MAGIC_BYTES = b"%PDF"
RENDER_DPI = 200


def is_pdf(content: bytes) -> bool:
    return content[:4] == PDF_MAGIC_BYTES


def render_pdf_to_images(pdf_bytes: bytes) -> list[bytes]:
    """Rasteriza cada página del PDF a PNG para alimentarlas al pipeline de OCR."""
    images: list[bytes] = []
    zoom = RENDER_DPI / 72
    matrix = fitz.Matrix(zoom, zoom)

    with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
        for page in document:
            pixmap = page.get_pixmap(matrix=matrix)
            images.append(pixmap.tobytes("png"))

    return images
