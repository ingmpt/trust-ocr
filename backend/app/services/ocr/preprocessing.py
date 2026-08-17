"""Pipeline de Preprocesamiento de imagen con OpenCV (HU 1.2): de-skewing, de-noising, contraste."""
import cv2
import numpy as np

MAX_AUTO_DESKEW_ANGLE_DEGREES = 15.0  # más allá de esto, es probable un ángulo mal estimado, no una foto torcida real


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("No se pudo decodificar la imagen del documento.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # El ángulo de inclinación se calcula sobre la imagen original (antes de
    # denoise/contraste) para no distorsionar el fondo y arruinar la detección.
    deskewed = _deskew(gray)
    denoised = cv2.fastNlMeansDenoising(deskewed, h=7)
    contrasted = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(denoised)
    return contrasted


def _deskew(image: np.ndarray) -> np.ndarray:
    _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(binary > 0))
    if coords.size == 0:
        return image

    angle = cv2.minAreaRect(coords)[-1]
    angle = -(90 + angle) if angle < -45 else -angle
    if abs(angle) < 0.3 or abs(angle) > MAX_AUTO_DESKEW_ANGLE_DEGREES:
        return image  # sin inclinación relevante, o ángulo no confiable: se evita rotar innecesariamente

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(image, rotation_matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=255)
