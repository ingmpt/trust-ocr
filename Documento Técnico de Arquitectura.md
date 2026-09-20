# Documento Técnico de Arquitectura: Trust OCR+

## Resumen técnico
Trust OCR+ se construye como una plataforma backend-céntrica orientada a API, con un pipeline asíncrono de procesamiento documental (preprocesamiento de imagen, OCR, reglas de extracción y corrección vía LLM) desacoplado de los módulos de gestión comercial (suscripciones, facturación) y de cumplimiento normativo (modos de privacidad, portal ARCO, auditoría). La arquitectura prioriza componentes open source y modularidad para permitir, en una fase posterior, sustituir el LLM externo por un modelo propio sin rediseñar el flujo de extracción, y para incorporar integraciones comerciales (pagos, facturación electrónica) sin comprometer el MVP, cuyo modelo de negocio es Freemium.

## Stack tecnológico

**Backend / API**: Python + FastAPI. Se elige por la necesidad explícita de documentación OpenAPI/Swagger (HU 1.4), generación automática de esquemas, y por ser el ecosistema natural para integrar OpenCV, motores OCR open source y SDKs de LLM sin capas de interoperabilidad adicionales.

**Preprocesamiento de imagen**: OpenCV (de-skewing, de-noising, ajuste de contraste), tal como se define explícitamente en la propuesta de valor y HU 1.2.

**Motor OCR**: **PP-OCRv3 (modelos de PaddleOCR, decisión final del sponsor), ejecutados vía ONNX Runtime** (`rapidocr-onnxruntime`) en vez del runtime nativo de PaddlePaddle. Migración realizada en producción (sept. 2026): PaddlePaddle nativo mostró un allocador de memoria que escala su consumo de RAM proporcional al `mem_limit` del contenedor en vez del tamaño real del documento, causando OOM irrecuperable en la VPS de 2GB (reproducible entre 1024m y 2048m de límite). ONNX Runtime usa los mismos modelos y mantiene la decisión del sponsor sobre el motor de detección/reconocimiento, solo cambia el runtime de inferencia subyacente. Justificado además por su soporte de detección de layout/tablas relevante para facturas y documentos con estructura tabular, y por el requisito explícito de evitar licenciamiento de terceros (HU 1.2).

**Infraestructura de cómputo**: **CPU sobre VPS de Hetzner (decisión final)**, confirmado por el sponsor. Esta decisión resuelve la inconsistencia previamente señalada entre el objetivo de costos bajos (uso exclusivo de CPU) y la meta de latencia <1.5s en modo Express; el compromiso de SLA de latencia debe calibrarse en función de pruebas de carga reales sobre esta infraestructura antes de comunicarse comercialmente (ver "Riesgos técnicos").

**Motor de reglas de extracción**: módulo determinístico propio para documentos de estructura conocida (facturas electrónicas SUNAT, incluida validación algorítmica del dígito verificador de RUC), separado del flujo OCR+LLM, según la "estrategia híbrida de extracción" descrita en el modelo de negocio y HU 1.2.

**Corrección/estructuración vía LLM**: integración con API externa (Gemini Flash Lite), abstraída detrás de una interfaz propia de "servicio de corrección" para permitir sustitución futura por modelo autogestionado sin impactar el resto del pipeline (mitiga riesgo de dependencia de proveedor, HU 1.2).

**Base de datos transaccional**: PostgreSQL. Justificado por la necesidad de consistencia fuerte en manejo de créditos/cuotas (HU 2.1, 2.3), prorrateo de planes (HU 2.2), estado de solicitudes ARCO (HU 3.2) y registros de auditoría con integridad referencial (HU 3.3).

**Cache/sesión efímera**: Redis, para sostener el resultado JSON del modo "Express" únicamente durante la sesión activa del usuario, sin persistencia en disco ni base de datos (HU 1.3, 3.1), y como backend de cola para procesamiento asíncrono.

**Cola de procesamiento asíncrono**: arquitectura de workers (ej. Celery u equivalente sobre Redis/broker de mensajes) para procesamiento por lote (ZIP), estimación de tiempo de procesamiento y notificación al finalizar (HU 1.1, 1.2, 1.3).

**Almacenamiento de objetos**: **Cloudflare R2 (decisión final)**, confirmado por el sponsor, con políticas de ciclo de vida (auto-eliminación a los 5 días) para el modo "Almacenado" (HU 3.1). El acceso se realiza mediante protocolo S3-compatible, pudiendo usarse el SDK/cliente de MinIO (u otro cliente S3-compatible) como capa de interacción con el bucket de Cloudflare R2, sin que ello implique el uso de un servidor MinIO propio.

**Generación de documentos PDF**: WeasyPrint, para compilar y generar al instante el reporte estructurado descargable ante una solicitud ARCO de Acceso (HU 3.2).

**Autenticación**: autenticación de usuarios (email/contraseña) para el portal web y gestión de claves API para acceso programático (HU 1.4, 4.1).

**Registro de auditoría e inmutabilidad**: **decisión final del sponsor** — la inmutabilidad del log de auditoría (eventos ARCO y de eliminación de datos) se garantiza mediante un servicio de proveedor externo, integrado vía API, que aplica firma electrónica con sello de tiempo y registro de hash en blockchain (sin subir datos en claro a la red). El registro base sigue almacenándose en PostgreSQL (append-only), con el hash/firma del proveedor externo como evidencia adicional de no-manipulación ante la ANPD. El proveedor específico de este servicio queda pendiente de selección (ver "Decisiones pendientes").

**Módulo de Pagos (preparado, no integrado en MVP)**: capa de abstracción de pasarela de pago diseñada para integrarse en el futuro con Culqi. No se implementa integración funcional en el MVP, dado que los planes de lanzamiento son Freemium sin cobro.

**Módulo de Facturación Electrónica (preparado, no integrado en MVP)**: capa de abstracción de emisión de comprobantes tributarios diseñada para integrarse en el futuro con Nubefact (OSE). No se implementa integración funcional en el MVP por el mismo motivo (modelo Freemium).

**Correo transaccional**: proveedor designado Zoho, integrado detrás de una interfaz de "servicio de notificaciones" para envío de confirmaciones de procesamiento, cambios de plan y resultados (HU 1.3, 2.2, 2.4).

## Componentes del sistema

- **Servicio de Ingesta de Documentos**: recepción de archivos individuales o ZIP vía web/API, validación de formato, control de progreso de carga. (HU 1.1)
- **Orquestador de Procesamiento Asíncrono**: encola documentos, gestiona lotes, calcula estimación de tiempo de procesamiento. (HU 1.1, 1.2)
- **Pipeline de Preprocesamiento (OpenCV)**: normaliza imágenes antes del OCR. (HU 1.2)
- **Motor OCR (PP-OCRv3 vía ONNX Runtime)**: extracción de texto crudo desde documentos preprocesados. (HU 1.2)
- **Motor de Reglas de Extracción Estructurada**: parsing determinístico para documentos SUNAT de formato conocido, incluida validación de RUC. (HU 1.2)
- **Servicio de Corrección/Estructuración LLM**: limpieza y estructuración de campos vía Gemini, con capa de abstracción para intercambio futuro de proveedor. (HU 1.2)
- **Servicio de Ensamblado de Resultados y Confianza**: genera el JSON final con score de confianza por campo. (HU 1.3)
- **Servicio de Notificaciones**: envío de correos/webhooks al completar procesamiento, cambios de plan, pagos, integrado con Zoho. (HU 1.3, 2.2, 2.4)
- **API Gateway y Documentación**: expone endpoints autenticados por API key, con documentación OpenAPI/Swagger, manejo uniforme de errores. (HU 1.4, 4.1)
- **Controlador de Modo de Privacidad**: enruta el procesamiento a flujo Express (sin persistencia, cache de sesión) o Almacenado (persistencia temporal 5 días en Cloudflare R2). (HU 3.1)
- **Servicio de Almacenamiento y Purga**: gestiona persistencia temporal en Cloudflare R2 y ejecuta eliminación física automática (vencimiento de retención) o manual (cancelación ARCO). (HU 3.1, 3.2)
- **Portal de Autoservicio ARCO**: formulario público (vía Formbricks o frontend propio, ver "Decisiones pendientes") accesible desde trustocr.com, con exigencia de validación estricta de identidad (DNI + foto del documento). Procesa las solicitudes según el derecho seleccionado:
  - *Acceso*: consulta los JSON vigentes (ventana de 5 días) asociados al DNI, compila un reporte estructurado y gen