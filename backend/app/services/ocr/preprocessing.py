"""Pipeline de Preprocesamiento de imagen con OpenCV (HU 1.2): de-skewing, de-noising, contraste."""
import cv2
import numpy as np


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("No se pudo decodificar la imagen del documento.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    contrasted = cv2.equalizeHist(denoised)
    deskewed = _deskew(contrasted)
    return deskewed


def _deskew(image: np.ndarray) -> np.ndarray:
    coords = np.column_stack(np.where(image < 255))
    if coords.size == 0:
        return image

    angle = cv2.minAreaRect(coords)[-1]
    angle = -(90 + angle) if angle < -45 else -angle

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(image, rotation_matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
