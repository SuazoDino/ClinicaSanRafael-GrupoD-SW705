# 1. Acta de constitución del proyecto

## 1.1. Datos generales
| Campo | Detalle |
| :--- | :--- |
| Nombre del proyecto | Sistema de Información Clínico-Administrativo - Clinica San Rafael |
| Patrocinador | Gerencia General, Clínica San Rafael S.A.C. |
| Equipo | D (3 integrantes, roles rotativos) |
| Fecha del acta | Semana 2 del ciclo académico |
| Product Owner de referencia | José Carlos García de la Riva |

## 1.2. Justificación del proyecto
La Clínica San Rafael opera con procesos manuales y fragmentados que provocan un 18% de inasistencia a citas, demoras de hasta 48 horas en resultados y riesgos de errores de medicación por historias clínicas físicas no unificadas. Además, la facturación manual con 5 EPS genera glosas que dañan el flujo de caja. Desarrollar un sistema unificado se justifica para centralizar la HCE, optimizar la agenda y agilizar los cobros, garantizando la continuidad de la atención y la confidencialidad de los datos.

## 1.3. Objetivos SMART
1. **Implementar el 100%** de los requerimientos del módulo de **Historia Clínica Electrónica (M1)** al finalizar el Sprint 1 (Semana 11) para centralizar antecedentes, consultas, diagnósticos (CIE-10), indicaciones y recetas.
2. Lograr un **tiempo de apertura de la historia clínica menor a 2 segundos** en el módulo M1 para una base de hasta 8 000 pacientes al cierre del Sprint 1 (Semana 11), garantizando trazabilidad y control de accesos por rol.
3. Desarrollar la **vista consolidada de disponibilidad** por médico y especialidad del módulo de **Agenda y Citas Médicas (M2)** al cierre del Sprint 1 (Semana 11), reduciendo el tiempo de agendamiento telefónico de 20 minutos a menos de 3 minutos por paciente.
4. Integrar el **envío automático de confirmaciones y recordatorios** (SMS, correo y WhatsApp) en el módulo M2 al finalizar el Sprint 1 (Semana 11), orientado a reducir la tasa de inasistencia (*no-show*) del 18% actual al 8%.

## 1.4. Alcance resumido
El proyecto comprende el diseño, desarrollo, pruebas e implementación del Sistema de Información Clínico-Administrativo. Se desarrollará de forma incremental en dos Sprints:
* **Sprint 1 (Semana 9 a 11):**
  * *M1. Historia Clínica Electrónica (HCE):* Registro unificado del paciente (antecedentes, consultas, diagnósticos CIE-10, indicaciones y recetas) con control de acceso restringido por rol y auditoría.
  * *M2. Agenda y Citas Médicas:* Programación multiespecialidad por médico, consolidación de disponibilidad, reprogramación, cancelación y confirmación/recordatorios automáticos.
* **Sprint 2 (Semana 12 a 14):**
  * *M3. Laboratorio e Imágenes:* Registro de órdenes médicas, carga de resultados digitales y notificación automática.
  * *M4. Facturación y Convenios:* Tarifarios por convenio (particular, 5 EPS, SOAT), gestión de copagos y seguimiento de glosas.
  * *M5. Reportes Gerenciales:* Dashboard en tiempo real de ocupación de consultorios, tiempos de espera, ingresos e inasistencias.
  * *M6. Portal del Paciente / Telemedicina (Deseable):* Agendamiento en línea y videoconsulta básica de seguimiento.

## 1.5. Exclusiones
1. El sistema no incluirá pasarela de pagos en línea en tiempo real ni integración con pasarelas bancarias externas; el registro de cobros y facturación se gestionará de manera interna en la caja de la clínica.
2. El sistema no gestionará la integración directa con plataformas externas de EPS/aseguradoras ni con equipos médicos (laboratorio, imágenes).
3. El sistema no cubrirá los procesos de hospitalización ni cirugía ambulatoria, quedando limitado a consulta ambulatoria, laboratorio, imágenes, farmacia y emergencia.

## 1.6. Supuestos y restricciones adicionales
1. **Supuesto (Disponibilidad de información clave):** La administración de la clínica proporcionará los catálogos de servicios, la nómina médica y los tarifarios de EPS en formatos digitales estructurados (Excel/CSV) antes del inicio del desarrollo, garantizando además la disponibilidad de usuarios clave para la validación de prototipos al cierre de cada sprint.
2. El proyecto está sujeto a un timebox estricto de 16 semanas para la entrega y despliegue final de la solución. Dado el presupuesto moderado y acotado asignado por la clínica para infraestructura, el equipo prioriza el uso de tecnologías de código abierto (open-source) y capas gratuitas (free tier) en servicios de la nube.
3. **Restricción (Normativa e interoperabilidad en salud):** El desarrollo del módulo de Historia Clínica Electrónica (M1) debe alinearse de forma obligatoria con la Ley N.° 29733 (Ley de Protección de Datos Personales) y con el estándar internacional de codificación diagnóstica CIE-10.

## 1.7. Riesgos iniciales
| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Resistencia al cambio por parte del personal médico habituado al uso de papel o registros personales en Excel. | Alto | Diseñar una interfaz UX/UI intuitiva y limpia que minimice los clics; realizar capacitaciones breves por rol y acompañamiento presencial en las primeras semanas. |
| Errores o duplicidad durante la migración inicial de datos provenientes de fichas físicas y archivos Excel dispersos de los +8 000 pacientes. | Medio-Alto | Desarrollar scripts de validación, formateo y deduplicación por DNI previa a la carga masiva en la base de datos relacional. |
| Caídas de conexión en horas de alta demanda de atención en la clínica. | Alto | Aplicar patrones de arquitectura resilientes (cacheo local, optimización de consultas SQL) y pruebas de carga para asegurar la apertura de HCE en menos de 2 segundos. |
| Acceso no autorizado o filtración de información clínica sensible. | Alto | Control de acceso basado en roles, cifrado en tránsito/reposo, bitácora de auditoría y cumplimiento de la Ley N.º 29733; uso exclusivo de datos ficticios/anonimizados. |

## 1.8. Hitos principales
| Semana | Hito |
| :---: | :--- |
| 2 | Acta de constitución y documento de visión |
| 4 | Especificación de requerimientos, backlog y modelos UML |
| 6 | Arquitectura, modelo de base de datos y prototipo UX/UI |
| 7 | Plan de release y sprint backlog 1 |
| 8 | Examen Parcial - sustentación del Entregable 1 |
| 16 | Examen Final - sustentación del Entregable 2 (producto funcionando) |
