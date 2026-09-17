# Backlog y Requisitos Funcionales: Trust OCR+

## Alcance del MVP
El MVP de Trust OCR+ se centrará en la funcionalidad central de digitalización y extracción de datos estructurados, ofreciendo una experiencia de usuario básica pero completa para la carga y recepción de resultados. Se implementará el modelo de negocio freemium y la gestión de suscripciones básicas, incluyendo la facturación electrónica compatible con SUNAT para transacciones. Un pilar fundamental del MVP será la implementación de las funcionalidades de privacidad y cumplimiento normativo (modos Express/Almacenado, portal ARCO y registro de auditoría) que son críticas para la propuesta de valor y los requisitos legales previos al lanzamiento.

Queda explícitamente fuera del alcance del MVP cualquier funcionalidad de reporting avanzado, integración con sistemas de terceros (más allá de la API propia), y la automatización completa de procesos de negocio del cliente (ej. RPA).

## Épica 1: Gestión de Documentos y Extracción de Datos
### Historia de usuario 1.1
Como usuario, quiero cargar documentos individualmente o en lotes (ZIP) a través de la interfaz web o API, para iniciar el proceso de extracción de datos.
- Criterios de aceptación:
  - El sistema permite cargar archivos de imagen (JPEG, PNG) o PDF individuales a través de la interfaz web.
  - El sistema permite cargar archivos ZIP que contengan múltiples imágenes o PDFs a través de la interfaz web.
  - El sistema proporciona un endpoint de API para la carga de documentos individuales.
  - El sistema proporciona un endpoint de API para la carga de lotes de documentos (ZIP).
  - El sistema valida el tipo de archivo al cargar y rechaza formatos no soportados.
  - El sistema muestra el progreso de la carga de archivos grandes o lotes.
- Prioridad: Must have

### Historia de usuario 1.2
Como usuario, quiero que el sistema procese automáticamente mis documentos utilizando OCR, preprocesamiento de imagen, modelos de lenguaje y reglas de extracción especializadas, para obtener datos estructurados y precisos.
- Criterios de aceptación:
  - El sistema aplica preprocesamiento de imagen (de-skewing, de-noising, ajuste de contraste) a los documentos cargados.
  - El sistema realiza OCR sobre los documentos preprocesados.
  - El sistema utiliza un modelo de lenguaje (LLM) para la corrección y estructuración de los datos extraídos.
  - El sistema aplica reglas de extracción específicas para documentos de estructura conocida (ej. facturas electrónicas SUNAT).
  - El sistema está optimizado para la extracción de datos de documentos SUNAT, DNI y SUNARP.
  - El sistema logra una Precisión del 99.5% y un Recall del 98.0% para la extracción de campos críticos (RUC Emisor, RUC Receptor, Número de Serie-Correlativo, Monto Total, IGV) en documentos SUNAT (Facturas, Boletas, Guías de Remisión Electrónicas).
  - El sistema valida algorítmicamente el RUC extraído de 11 dígitos mediante el "dígito de verificación" antes de guardarlo.
  - El sistema logra una Precisión del 97.0% y un Recall del 95.0% para la extracción de campos críticos (Número de DNI, Nombres, Apellidos, Dígito de Verificación, Fecha de Caducidad) en documentos de identidad (DNI Azul, DNI Electrónico).
  - El sistema logra una Precisión del 92.0% y un Recall del 90.0% para la extracción de campos críticos (RUC, Fecha, Monto Total) en tickets térmicos (grifos, supermercados, restaurantes).
  - El sistema utiliza un modelo de lenguaje (LLM) para corregir y limpiar datos extraídos de tickets térmicos con formato fragmentado o dañado (ej. "T0T4L: S/. 1O0.00" a {"total": 100.00}).
  - El sistema proporciona una estimación de tiempo de procesamiento para cargas masivas.
- Prioridad: Must have

### Historia de usuario 1.3
Como usuario, quiero recibir los datos extraídos en formato JSON con un nivel de confianza por campo, para integrarlos fácilmente en mis sistemas o decidir si requieren revisión manual.
- Criterios de aceptación:
  - El sistema asigna un identificador único a cada documento procesado.
  - El sistema hace los datos extraídos accesibles a través de un endpoint de API.
  - La salida JSON incluye pares clave-valor para los campos de datos extraídos.
  - Cada campo extraído en la salida JSON incluye una puntuación de confianza (ej. 0-100%).
  - El sistema notifica al usuario (ej. webhook o correo electrónico) cuando los resultados de procesamiento están disponibles.
  - El sistema retiene los resultados procesados para su recuperación durante la sesión activa del usuario en modo "Express" y 5 días en modo "Almacenado".
- Prioridad: Must have

### Historia de usuario 1.4
Como desarrollador, quiero acceder a una API bien documentada para cargar documentos y recuperar datos extraídos programáticamente, para integrar Trust OCR+ en mis aplicaciones.
- Criterios de aceptación:
  - El sistema requiere autenticación (ej. clave API) para acceder a los endpoints.
  - La documentación de la API (ej. Swagger/OpenAPI) está disponible y es comprensible.
  - La API soporta la carga de documentos individuales y en lotes.
  - La API permite la recuperación de resultados de procesamiento.
  - Los códigos de error de la API son claros y descriptivos.
- Prioridad: Must have

## Épica 2: Gestión de Suscripciones y Facturación
### Historia de usuario 2.1
Como nuevo usuario, quiero registrarme para una cuenta freemium con una cuota limitada de páginas, para probar el servicio antes de contratar un plan de pago.
- Criterios de aceptación:
  - El sistema permite el registro de usuarios con correo electrónico y contraseña.
  - Los usuarios recién registrados se asignan automáticamente al plan Freemium.
  - El plan Freemium incluye una cuota de 50 páginas por mes.
  - El sistema define 1 crédito de página como 1 archivo PDF de una sola hoja o 1 imagen (JPEG/PNG); si un PDF tiene N páginas, el sistema descuenta N créditos.
  - El sistema rastrea el uso de páginas para usuarios Freemium.
  - El sistema notifica al usuario cuando se acerca al límite de su cuota (ej. al 80% de uso).
  - El sistema bloquea el procesamiento adicional para usuarios Freemium que exceden su límite, respondiendo con un código 402 Payment Required y congelando el servicio hasta el próximo ciclo de facturación o una actualización de plan.
  - Los créditos de página incluidos en el plan mensual no son acumulables y se reinician a cero el primer día de cada ciclo de facturación.
- Prioridad: Must have

### Historia de usuario 2.2
Como usuario, quiero visualizar los planes de suscripción disponibles (Básico, Crecimiento, Corporativo) y poder actualizar mi plan, para elegir el volumen que mejor se adapte a mis necesidades.
- Criterios de aceptación:
  - El sistema muestra la información de los planes de suscripción (Básico, Crecimiento, Corporativo), incluyendo límites de páginas y precios mensuales.
  - El sistema muestra el Plan Base con un costo de S/ 50 al mes e incluye 500 páginas.
  - El sistema muestra el Plan Crecimiento con un costo de S/ 150 al mes e incluye 2,000 páginas.
  - El sistema muestra el Plan Corporativo con un costo de S/ 400 al mes e incluye 7,000 páginas.
  - Los usuarios pueden iniciar una actualización de plan desde Freemium o un plan de nivel inferior a uno superior.
  - El sistema prorratea los cargos/créditos por actualizaciones realizadas a mitad de ciclo de facturación.
  - El sistema envía correos electrónicos de confirmación para los cambios de plan.
  - Los usuarios pueden ver su plan actual y su uso restante en su panel de control.
- Prioridad: Must have

### Historia de usuario 2.3
Como usuario, quiero que mi consumo por encima de la cuota de mi plan se facture bajo un esquema de pago por uso con precios por página adicional, para pagar solo por lo que realmente consumo.
- Criterios de aceptación:
  - El sistema rastrea con precisión las páginas procesadas que exceden la cuota del plan del usuario, según la definición de 1 crédito de página.
  - El sistema aplica un costo de S/ 0.15 por página adicional para usuarios del Plan Base.
  - El sistema aplica un costo de S/ 0.09 por página adicional para usuarios del Plan Crecimiento.
  - El sistema aplica un costo de S/ 0.06 por página adicional para usuarios del Plan Corporativo.
  - El sistema genera un informe detallado de uso para los cargos por pago por uso al final del ciclo de facturación.
  - El sistema resta el crédito de página antes de iniciar el procesamiento de un documento.
  - Si el saldo de créditos del usuario llega a 0, la API responde con un código 402 Payment Required y congela el servicio hasta que el cliente pague el saldo extra o actualice su plan.
- Prioridad: Must have

### Historia de usuario 2.4
Como usuario, quiero recibir facturas electrónicas compatibles con la normativa SUNAT y gestionar mis métodos de pago, para asegurar una contabilidad adecuada y un servicio ininterrumpido.
- Criterios de aceptación:
  - El sistema genera facturas electrónicas que cumplen con los requisitos de SUNAT para todas las transacciones pagadas (suscripciones, pago por uso).
  - El sistema permite a los usuarios añadir y gestionar métodos de pago con tarjeta de crédito.
  - El sistema procesa automáticamente los pagos recurrentes de suscripción.
  - El sistema envía la confirmación de pago y la factura por correo electrónico.
  - El sistema notifica a los usuarios sobre pagos fallidos y proporciona opciones para su resolución.
- Prioridad: Must have

## Épica 3: Privacidad y Cumplimiento Normativo
### Historia de usuario 3.1
Como usuario que maneja datos sensibles, quiero elegir entre los modos de procesamiento "Express (sin persistencia)" y "Almacenado (retención de 5 días)", para controlar la persistencia de datos según mis necesidades de privacidad.
- Criterios de aceptación:
  - El sistema ofrece una opción en la interfaz de usuario (para cargas web) y un parámetro de API (para cargas API) para seleccionar el modo "Express" o "Almacenado".
  - En modo "Express", el sistema asegura la destrucción inmediata de imágenes y datos extraídos en bruto una vez entregado el resultado JSON, sin persistencia en disco ni base de datos. El resultado JSON final está disponible para su recuperación únicamente durante la sesión activa del usuario; una vez que la sesión finaliza, los datos no son recuperables.
  - El sistema procesa documentos en modo "Express" y retorna el JSON estructurado en menos de 1.5 segundos.
  - En modo "Almacenado", el sistema almacena imágenes de documentos y datos extraídos en bruto por un período de 5 días.
  - El sistema realiza una eliminación física definitiva de los datos almacenados después de 5 días.
  - El sistema comunica claramente la política de retención de datos para cada modo al usuario.
- Prioridad: Must have

### Historia de usuario 3.2
Como interesado o usuario actuando en nombre de interesados, quiero un portal de autoservicio para ejercer los derechos ARCO (Acceso, Rectificación, Cancelación, Oposición) sobre los datos personales procesados por Trust OCR+, para cumplir con la Ley N° 29733.
- Criterios de aceptación:
  - El sistema proporciona un portal web dedicado para solicitudes ARCO.
  - El sistema exige validación de identidad (ej. ingreso de DNI y carga de foto del documento) para procesar solicitudes ARCO.
  - Los usuarios pueden enviar solicitudes de Acceso a sus datos personales.
  - El sistema genera un reporte estructurado en formato PDF descargable con los datos personales asociados al DNI del solicitante.
  - Los usuarios pueden enviar solicitudes de Rectificación de datos personales inexactos.
  - El sistema permite al usuario corregir campos de datos personales específicos a través del portal.
  - Los usuarios pueden enviar solicitudes de Cancelación (eliminación) de sus datos personales.
  - El sistema ejecuta la destrucción física inmediata de todos los datos personales asociados al DNI del solicitante, anulando cualquier período de retención restante.
  - Los usuarios pueden enviar solicitudes de Oposición al procesamiento de sus datos personales.
  - El sistema envía una confirmación de recepción de la solicitud al usuario.
  - El sistema proporciona un mecanismo para rastrear el estado de una solicitud ARCO.
- Prioridad: Must have

### Historia de usuario 3.3
Como administrador, quiero un registro de auditoría inmutable de todas las acciones de procesamiento de datos, especialmente las solicitudes ARCO y los eventos de retención/eliminación de datos, para demostrar el cumplimiento con la Ley N° 29733.
- Criterios de aceptación:
  - El sistema registra todas las solicitudes ARCO (envío, cambios de estado, finalización) con marcas de tiempo e identificadores de usuario.
  - El registro de auditoría incluye la fecha, tipo de derecho ARCO ejecutado y un token de validación.
  - El sistema registra todos los eventos de eliminación de datos (manuales o automáticos por retención de 5 días) con marcas de tiempo e identificadores de documento.
  - El registro de auditoría es accesible solo para personal autorizado.
  - El registro de auditoría es inmutable y a prueba de manipulaciones.
- Prioridad: Must have

## Épica 4: Administración de la Plataforma
### Historia de usuario 4.1
Como usuario, quiero gestionar mi información personal (correo electrónico, contraseña) y ver los detalles de mi cuenta, para mantener mi información actualizada y segura.
- Criterios de aceptación:
  - Los usuarios pueden cambiar su dirección de correo electrónico después de una reverificación.
  - Los usuarios pueden cambiar su contraseña.
  - Los usuarios pueden ver su plan actual y estadísticas de uso.
  - Los usuarios pueden generar y gestionar sus claves API.
- Prioridad: Must have

### Historia de usuario 4.2
Como administrador de la plataforma, quiero un panel para revisar, aprobar, editar o rechazar plantillas de documento sugeridas automáticamente por el sistema, para mantener el catálogo de plantillas con buena calidad sin que crezca de forma descontrolada.
- Criterios de aceptación:
  - El sistema soporta un rol de administrador (`admin`) diferenciado del rol de usuario estándar.
  - Solo usuarios con rol `admin` pueden acceder al panel de administración de plantillas.
  - Cuando un documento no coincide con ninguna plantilla existente del usuario, el sistema genera automáticamente (en segundo plano, sin bloquear la respuesta al usuario) una plantilla sugerida en estado "borrador" (`is_draft = true`) a partir de los campos detectados.
  - Las plantillas en estado "borrador" no participan en la clasificación automática de documentos (HU 1.2) hasta ser aprobadas, para evitar degradar la precisión con plantillas de baja calidad.
  - El panel de administración lista las plantillas en estado "borrador" pendientes de revisión.
  - El administrador puede aprobar una plantilla borrador (pasa a estado activo y queda disponible para clasificación automática), editarla (nombre, descripción, campos) antes de aprobar, o rechazarla (se elimina).
  - El administrador puede activar/desactivar cualquier plantilla del catálogo global en cualquier momento.
  - El sistema evita crear una plantilla borrador duplicada si ya existe una plantilla (activa o borrador) suficientemente similar para el mismo tipo de documento.
- Prioridad: Should have
- Nota: alcance definido a partir de conversación de diseño durante el desarrollo del MVP (ver artefacto de cierre); pendiente de estimación y priorización formal antes de su construcción.

## Elementos que requieren definición adicional