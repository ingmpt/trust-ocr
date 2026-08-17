# Lineamientos UX/UI: Trust OCR+

## Principios de diseño
- **Confianza y Seguridad:** Todas las interacciones deben infundir confianza en la precisión de la extracción de datos y la seguridad de la información, especialmente en el manejo de datos sensibles y el cumplimiento normativo.
- **Eficiencia y Claridad:** La interfaz debe permitir a los usuarios completar sus tareas rápidamente, desde la carga de documentos hasta la visualización de resultados, con información clara y concisa.
- **Simplicidad en la Gestión:** La administración de la cuenta, suscripciones y configuración de privacidad debe ser intuitiva y fácil de entender, minimizando la curva de aprendizaje.
- **Transparencia en el Procesamiento:** Los usuarios deben tener visibilidad clara sobre el estado de sus documentos, el uso de su cuota y las políticas de retención de datos.

## Inventario de pantallas
| Pantalla | Historia(s) de usuario que cubre | Propósito |
|---|---|---|
| Registro de Usuario | HU 2.1 | Permite a nuevos usuarios crear una cuenta freemium. |
| Inicio de Sesión | (Implícito) | Permite a usuarios existentes acceder a su cuenta. |
| Panel de Control (Dashboard) | HU 2.1, 2.2, 2.3, 4.1 | Proporciona una vista general del estado de la cuenta, uso de créditos, plan actual y acceso rápido a funciones clave. |
| Carga de Documentos y Progreso | HU 1.1, 3.1 | Permite a los usuarios cargar documentos y seleccionar el modo de privacidad, mostrando el progreso de la carga. |
| Resultados de Procesamiento | HU 1.3 | Muestra los datos extraídos de un documento, con sus niveles de confianza, y permite descargar el JSON. |
| Planes de Suscripción | HU 2.2 | Muestra los planes de suscripción disponibles y permite al usuario actualizar su plan. |
| Gestión de Métodos de Pago | HU 2.4 | Permite a los usuarios añadir, actualizar o eliminar sus métodos de pago. |
| Historial de Facturas | HU 2.4 | Muestra las facturas electrónicas generadas por el sistema. |
| Mi Cuenta - Perfil y Configuración | HU 4.1 | Permite al usuario gestionar su información personal (email, contraseña). |
| Mi Cuenta - Gestión de Claves API | HU 1.4, 4.1 | Permite a los desarrolladores generar y gestionar sus claves API. |
| Portal ARCO - Identificación | HU 3.2 | Pantalla inicial del portal ARCO para validar la identidad del solicitante. |
| Portal ARCO - Selector de Derecho | HU 3.2 | Permite al usuario elegir el derecho ARCO a ejercer (Acceso, Rectificación, Cancelación, Oposición). |
| Portal ARCO - Solicitud de Acceso | HU 3.2 | Permite al usuario solicitar un reporte de sus datos personales. |
| Portal ARCO - Solicitud de Rectificación | HU 3.2 | Permite al usuario solicitar la corrección de sus datos personales. |
| Portal ARCO - Solicitud de Cancelación | HU 3.2 | Permite al usuario solicitar la eliminación de sus datos personales. |
| Portal ARCO - Solicitud de Oposición | HU 3.2 | Permite al usuario oponerse al procesamiento de sus datos personales. |
| Portal ARCO - Seguimiento de Solicitudes | HU 3.2 | Permite al usuario rastrear el estado de sus solicitudes ARCO. |

## Detalle por pantalla

### Registro de Usuario
- Elementos principales: Formulario de registro con campos para Correo Electrónico, Contraseña (con confirmación), checkbox para aceptar Términos y Condiciones/Política de Privacidad, botón "Registrarse". Texto informativo sobre el plan Freemium y sus límites.
- Flujo de navegación: Accedido desde la página de inicio o botón "Registrarse". Tras el registro exitoso, redirige al Panel de Control.
- Estados relevantes: Campos vacíos, error de validación (ej. email inválido, contraseñas no coinciden), registro exitoso.

### Inicio de Sesión
- Elementos principales: Formulario con campos para Correo Electrónico, Contraseña, botón "Iniciar Sesión". Enlace "¿Olvidaste tu contraseña?". Enlace "Registrarse".
- Flujo de navegación: Accedido desde la página de inicio. Tras inicio de sesión exitoso, redirige al Panel de Control.
- Estados relevantes: Campos vacíos, credenciales incorrectas, inicio de sesión exitoso.

### Panel de Control (Dashboard)
- Elementos principales:
    - Tarjeta/sección con "Mi Plan Actual" (ej. "Freemium", "Básico"), mostrando créditos de página restantes y fecha de reinicio. Botón "Actualizar Plan".
    - Gráfico o barra de progreso visual del uso de páginas del ciclo actual.
    - Notificaciones de uso cercano al límite (ej. 80%).
    - Sección de "Documentos Recientes" (miniaturas o listado de últimos documentos procesados).
    - Enlaces rápidos a: Carga de Documentos, Planes de Suscripción, Mi Cuenta, Historial de Facturas, Gestión de Claves API.
- Flujo de navegación: Es la página de inicio tras iniciar sesión. Puede navegar a todas las demás secciones principales del producto.
- Estados relevantes: Cuenta Freemium con créditos restantes, cuenta Freemium con créditos agotados (mensaje de bloqueo), cuenta de pago con créditos restantes, cuenta de pago con sobreuso (indicando cargos adicionales).

### Carga de Documentos y Progreso
- Elementos principales:
    - Área de "arrastrar y soltar" (drag-and-drop) para archivos, con botón "Seleccionar Archivos".
    - Selector para Modo de Procesamiento: "Express (sin persistencia)" con descripción clara de la política de retención, y "Almacenado (retención de 5 días)" con su descripción.
    - Lista de archivos seleccionados con sus nombres y tamaño.
    - Indicador de progreso individual para cada archivo o progreso general para lotes (barra de progreso, porcentaje, estimación de tiempo para lotes).
    - Mensajes de error para formatos no soportados.
    - Botón "Procesar Documentos".
- Flujo de navegación: Accedido desde el Panel de Control. Tras el procesamiento, el usuario puede ir a la pantalla de Resultados de Procesamiento o permanecer en el Panel de Control para ver el estado.
- Estados relevantes: Vacío (ningún archivo seleccionado), archivos listos para cargar, cargando (con progreso), error de carga (ej. formato inválido, tamaño excedido), carga exitosa, procesamiento en curso (con estimación).

### Resultados de Procesamiento
- Elementos principales:
    - Identificador único del documento.
    - Vista previa del documento original (si es posible, para contexto visual sin almacenar el documento original en el frontend).
    - Tabla o listado de pares clave-valor de datos extraídos, con una columna para la "Puntuación de Confianza" por cada campo.
    - Botón "Descargar JSON".
    - Mensaje indicando el modo de procesamiento (Express/Almacenado) y la política de retención de datos aplicada.
    - Opción para procesar un nuevo documento o volver al Panel de Control.
- Flujo de navegación: Accedido desde una notificación (ej. correo electrónico o webhook) o desde el Panel de Control tras completar un procesamiento.
- Estados relevantes: Datos disponibles, datos no encontrados (ej. documento ilegible), error de procesamiento. Para el modo "Express", mensaje claro si los datos ya no están disponibles tras el cierre de sesión.

### Planes de Suscripción
- Elementos principales:
    - Tarjetas o secciones para cada plan (Freemium, Básico, Crecimiento, Corporativo), mostrando: nombre del plan, precio mensual, límite de páginas incluido, precio por página adicional.
    - El plan actual del usuario debe estar claramente resaltado.
    - Botón "Actualizar a este plan" para los planes superiores.
    - Información sobre el prorrateo de cargos/créditos para actualizaciones a mitad de ciclo.
- Flujo de navegación: Accedido desde el Panel de Control o desde un mensaje de límite de cuota. Tras seleccionar un nuevo plan, redirige a la Gestión de Métodos de Pago si es necesario, o al Panel de Control con confirmación.
- Estados relevantes: Plan actual resaltado, planes disponibles para actualizar, confirmación de cambio de plan.

### Gestión de Métodos de Pago
- Elementos principales:
    - Formulario para añadir nueva tarjeta de crédito (Número de Tarjeta, Fecha de Vencimiento, CVV, Nombre del Titular).
    - Listado de métodos de pago existentes (con últimos 4 dígitos de la tarjeta, fecha de vencimiento).
    - Opción para establecer un método de pago como principal.
    - Botón "Eliminar" para métodos de pago existentes.
    - Botón "Guardar".
- Flujo de navegación: Accedido desde el Panel de Control, Mi Cuenta o durante el flujo de Actualización de Plan.
- Estados relevantes: Sin métodos de pago, métodos de pago existentes, error de validación de tarjeta, éxito al añadir/actualizar/eliminar.

### Historial de Facturas
- Elementos principales:
    - Tabla con listado de facturas: Fecha, Número de Factura, Monto, Estado (Pagada, Pendiente, Fallida), Botón "Descargar PDF".
    - Filtros por fecha o estado (opcional, si hay muchas facturas).
- Flujo de navegación: Accedido desde el Panel de Control o Mi Cuenta.
- Estados relevantes: Lista vacía, facturas disponibles, facturas con pago fallido.

### Mi Cuenta - Perfil y Configuración
- Elementos principales:
    - Campo editable para Correo Electrónico (con botón "Cambiar" que active un flujo de reverificación).
    - Campo para Contraseña actual y campos para Nueva Contraseña y Confirmar Nueva Contraseña (con botón "Cambiar Contraseña").
    - Botón "Guardar Cambios".
- Flujo de navegación: Accedido desde el Panel de Control.
- Estados relevantes: Campos con información actual, campos editados, error de validación (ej. contraseña actual incorrecta, nueva contraseña débil), éxito al guardar.

### Mi Cuenta - Gestión de Claves API
- Elementos principales:
    - Listado de claves API existentes (con opción de copiar).
    - Botón "Generar Nueva Clave API".
    - Botón "Revocar" para claves existentes (con confirmación).
    - Instrucciones claras sobre el uso y seguridad de las claves API.
    - Enlace a la Documentación de API (externa).
- Flujo de navegación: Accedido desde el Panel de Control o Mi Cuenta.
- Estados relevantes: Sin claves API, claves API generadas, confirmación de revocación.

### Portal ARCO - Identificación
- Elementos principales:
    - Campos para DNI del solicitante.
    - Área para "Subir foto del documento de identidad" (frontal y/o reverso, según necesidad de validación).
    - Texto explicativo sobre la necesidad de validación de identidad y la Ley N° 29733.
    - Botón "Validar Identidad".
- Flujo de navegación: Punto de entrada público al Portal ARCO. Tras validación exitosa, redirige al Selector de Derecho.
- Estados relevantes: Campos vacíos, DNI inválido, foto no subida o ilegible, identidad validada, error de validación.

### Portal ARCO - Selector de Derecho
- Elementos principales:
    - Opciones de radio button o botones claros para cada derecho ARCO: "Acceso", "Rectificación", "Cancelación", "Oposición".
    - Descripción concisa de lo que implica cada derecho.
    - Botón "Continuar".
- Flujo de navegación: Accedido tras la Identificación exitosa. Redirige a la pantalla específica del derecho seleccionado.
- Estados relevantes: Opción seleccionada.

### Portal ARCO - Solicitud de Acceso
- Elementos principales:
    - Confirmación del DNI validado.
    - Botón "Generar Reporte de Datos Personales".
    - Mensaje informativo sobre el formato del reporte (PDF) y el contenido.
- Flujo de navegación: Accedido desde el Selector de Derecho. Tras generar el reporte, se ofrece la descarga y un mensaje de éxito/confirmación.
- Estados relevantes: Reporte generado y descargable, error al generar reporte.

### Portal ARCO - Solicitud de Rectificación
- Elementos principales:
    - Confirmación del DNI validado.
    - Listado de campos de datos personales que pueden ser rectificados (ej. Nombres, Apellidos, Dirección).
    - Campos de texto editables para los nuevos valores.
    - Campo para "Motivo de la Rectificación".
    - Botón "Enviar Solicitud de Rectificación".
- Flujo de navegación: Accedido desde el Selector de Derecho. Tras el envío exitoso, redirige al Seguimiento de Solicitudes o muestra un mensaje de confirmación.
- Estados relevantes: Campos editables, error de validación, solicitud enviada.

### Portal ARCO - Solicitud de Cancelación
- Elementos principales:
    - Confirmación del DNI validado.
    - Mensaje de advertencia claro sobre la irreversibilidad de la eliminación de datos.
    - Campo para "Motivo de la Cancelación" (opcional).
    - Checkbox de confirmación "Entiendo que mis datos serán eliminados permanentemente".
    - Botón "Confirmar Cancelación".
- Flujo de navegación: Accedido desde el Selector de Derecho. Tras el envío exitoso, redirige al Seguimiento de Solicitudes o muestra un mensaje de confirmación.
- Estados relevantes: Advertencia visible, confirmación requerida, solicitud enviada.

### Portal ARCO - Solicitud de Oposición
- Elementos principales:
    - Confirmación del DNI validado.
    - Campo para "Motivo de la Oposición".
    - Botón "Enviar Solicitud de Oposición".
- Flujo de navegación: Accedido desde el Selector de Derecho. Tras el envío exitoso, redirige al Seguimiento de Solicitudes o muestra un mensaje de confirmación.
- Estados relevantes: Campo editable, solicitud enviada.

### Portal ARCO - Seguimiento de Solicitudes
- Elementos principales:
    - Tabla con listado de solicitudes ARCO enviadas por el usuario: Fecha de Solicitud, Tipo de Derecho, Estado (Pendiente, En Proceso, Completada, Rechazada), Token de Validación.
    - Detalles de la solicitud seleccionada al hacer clic (si aplica).
- Flujo de navegación: Accedido desde cualquier pantalla de solicitud ARCO tras el envío, o directamente desde el inicio del Portal ARCO.
- Estados relevantes: Lista vacía, solicitudes en diferentes estados.

## Patrones de interacción transversales

-   **Manejo de Errores:**
    -   **Errores de Validación de Formulario:** Mensajes de error específicos y contextuales junto a los campos afectados (ej. "Correo electrónico inválido", "Este campo es obligatorio", "Las contraseñas no coinciden").
    -   **Errores de Carga de Archivos:** Mensajes claros sobre el tipo de archivo no soportado o el tamaño excedido, con sugerencias para corregir.
    -   **Errores de Procesamiento:** Mensajes informativos sobre fallos en el procesamiento del documento, sugiriendo revisión del archivo o reintento.
    -   **Errores de API (ej. 402 Payment Required):** Diálogos modales o banners prominentes que expliquen la causa (ej. "Créditos agotados") y ofrezcan una solución (ej. "Actualizar plan").
    -   **Errores Generales del Sistema:** Mensajes amigables que indiquen un problema inesperado y sugieran reintentar o contactar soporte.

-   **Confirmaciones:**
    -   **Acciones Destructivas (ej. eliminar método de pago, revocar clave API, Cancelación ARCO):** Diálogos modales de confirmación con un mensaje claro del impacto de la acción y botones "Confirmar" y "Cancelar".
    -   **Operaciones Exitosas:** Mensajes de "toast" (notificaciones temporales) o banners de éxito (ej. "Plan actualizado con éxito", "Clave API generada").
    -   **Notificaciones por Correo Electrónico:** Para cambios de plan, resultados de procesamiento, pagos exitosos/fallidos y confirmación de recepción de solicitudes ARCO.

-   **Estados de Carga:**
    -   **Carga de Archivos:** Barras de progreso visuales con porcentaje y, para lotes grandes, una estimación de tiempo.
    -   **Procesamiento de Documentos:** Indicadores de "cargando" (spinners, barras de progreso) en la interfaz mientras el sistema procesa, con mensajes como "Procesando su documento...".
    -   **Operaciones de API:** Deshabilitar botones y mostrar un spinner o indicador de progreso mientras se espera la respuesta del servidor (ej. al guardar un formulario, al actualizar un plan).

-   **Navegación:**
    -   **Barra de Navegación Global:** Consistente en todas las pantallas principales (Panel de Control, Carga, Mi Cuenta, etc.) para facilitar el acceso a las secciones clave.
    -   **Enlaces Claros:** Textos de enlace descriptivos y botones con llamadas a la acción explícitas.
    -   **Flujos Lógicos:** Secuencias de pantallas intuitivas para tareas complejas (ej. registro, actualización de plan).

## Consideraciones de accesibilidad

-   **Contraste de Color:** Asegurar un contraste adecuado entre el texto y el fondo para facilitar la lectura, especialmente para usuarios con deficiencias visuales (considerar WCAG 2.1 AA).
-   **Navegación por Teclado:** Todos los elementos interactivos (botones, enlaces, campos de formulario) deben ser accesibles y operables mediante el teclado, con un indicador de foco visible.
-   **Tamaños de Texto:** Utilizar unidades de tamaño de fuente relativas (ej. `rem`, `em`) para permitir que los usuarios ajusten el tamaño del texto a través de la configuración del navegador.
-   **Etiquetas Claras:** Todos los campos de formulario deben tener etiquetas asociadas (`<label>`) para que sean accesibles a lectores de pantalla.
-   **Mensajes de Error Accesibles:** Los mensajes de error deben ser claros, descriptivos y estar asociados programáticamente a los campos de formulario correspondientes.
-   **Textos Alternativos (Alt Text):** Aunque no se generan imágenes, cualquier icono o elemento visual que transmita información debe tener un texto alternativo descriptivo para lectores de pantalla.
-   **Estructura Semántica:** Utilizar HTML semántico (encabezados, listas, regiones) para mejorar la navegación y comprensión del contenido por parte de los lectores de pantalla.

## Elementos que requieren definición adicional
(Ninguno - la información proporcionada en el backlog y documento técnico es suficiente para definir las pantallas y flujos en este nivel de detalle.)