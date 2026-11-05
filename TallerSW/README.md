# Sistema de Información Clínico-Administrativo - Clínica San Rafael S.A.C. (SICA-CSR)

**Equipo D:**  
• Zamudio Sanchez Farid Paolo (Scrum Master)  
• Suazo Zanabria Dino Paul Roel (Product Owner)  
• Fernandez Dueñas Yazid Elio (Desarrollador)  

---

## Índice de Navegación

* **[01. Introducción y Visión](01_introduccion_y_vision/)**
  * [`01_caso_empresarial.md`](01_introduccion_y_vision/01_caso_empresarial.md) - Contexto de la Clínica San Rafael S.A.C., alcance funcional y restricciones.
  * [`02_acta_constitucion.md`](01_introduccion_y_vision/02_acta_constitucion.md) - Datos generales, objetivos SMART, alcance, supuestos, riesgos e hitos.
  * [`03_documento_vision.md`](01_introduccion_y_vision/03_documento_vision.md) - Declaración de visión, perfiles de usuario y factibilidad.

* **[02. Requerimientos y Modelos UML](02_requerimientos_y_uml/)**
  * [`01_especificacion_requerimientos.md`](02_requerimientos_y_uml/01_especificacion_requerimientos.md) - ERS, RFs, RNFs, Historias de Usuario (INVEST) y Product Backlog (MoSCoW).
  * [`02_modelos_uml.md`](02_requerimientos_y_uml/02_modelos_uml.md) - Diagrama de Casos de Uso, Clases y Actividades.

* **[03. Arquitectura y Base de Datos](03_arquitectura_y_base_de_datos/)**
  * [`01_arquitectura_software.md`](03_arquitectura_y_base_de_datos/01_arquitectura_software.md) - SAD, estilo arquitectónico, vistas 4+1, ADRs y stack tecnológico.
  * [`02_modelo_base_de_datos.md`](03_arquitectura_y_base_de_datos/02_modelo_base_de_datos.md) - Modelo ER, diccionario de datos y script DDL.

* **[04. Prototipo, Planificación y Sustentación](04_prototipo_y_planificacion/)**
  * [`01_prototipo_ux_ui.md`](04_prototipo_y_planificacion/01_prototipo_ux_ui.md) - Wireframes y flujo de navegación UX/UI.
  * [`02_plan_release.md`](04_prototipo_y_planificacion/02_plan_release.md) - Plan de release, objetivo y Sprint Backlog 1, tareas técnicas, cronograma y Definition of Done.
  * [`03_matriz_trazabilidad.md`](04_prototipo_y_planificacion/03_matriz_trazabilidad.md) - Matriz de trazabilidad: de la necesidad del negocio a la tarea del Sprint 1.

* **[assets/](assets/)**
  * Carpeta destinada para almacenar los diagramas, imágenes y recursos visuales del proyecto.

---

## Declaración de uso de asistentes de IA

El equipo usó **Claude Code (Anthropic)** como asistente de programación y redacción. La IA propuso borradores; las decisiones de alcance y diseño las tomó el equipo, que responde por todo el contenido del entregable.

| Artefacto | Qué generó la IA | Cómo se validó | Responde |
| :--- | :--- | :--- | :--- |
| Backend del Sprint 1 (M1 y M2) | Esquemas, servicios y rutas de los endpoints definidos en `sica-csr/CONTRATO_API_SPRINT1.md` | 38 pruebas automáticas (pytest) y prueba manual de cada pantalla con datos ficticios | Suazo (BD/API) |
| Conexión del frontend a la API | Reemplazo de la BD simulada por llamadas HTTP en `api.js` | Recorrido de las pantallas con cada rol | Fernandez (UI) |
| Datos de ejemplo | Agenda de ejemplo en `db/cargar_datos_prueba.py` | Revisión de que todos los datos son ficticios | Zamudio (Datos) |
| Diagramas UML, E-R y de arquitectura | Código PlantUML de los diagramas | Comparación con el esquema real de la BD (`db/sql`) y con el ERS | Equipo |
| Revisión de la documentación | Detección de contradicciones entre documentos y propuestas de corrección | Lectura y aprobación de cada cambio por el equipo | Equipo |
| Capturas del prototipo | Capturas automáticas de las pantallas | Revisión visual del equipo | Equipo |

**Decisiones tomadas por el equipo, no por la IA:** limitar el recordatorio a WhatsApp, implementar la respuesta del paciente (HU09), dejar pendiente el despliegue en la nube (T05) y mantener la gestión de personal como prototipo por aprobar.

**Datos:** en ninguna etapa se usaron datos reales de pacientes; todos los datos de prueba son ficticios.
