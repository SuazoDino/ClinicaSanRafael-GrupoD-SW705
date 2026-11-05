# 2. Documento de visión

## 2.1. Declaración de visión
> **Para** el personal médico, administrativo y los pacientes de la Clínica San Rafael S.A.C. **que** necesitan una gestión de información clínica y administrativa unificada, oportuna y confiable, **el SICA-CSR** (Sistema de Información Clínico-Administrativo Clínica San Rafael) **es un** sistema de información clínico-administrativo web **que** integra la historia clínica electrónica, la agenda de citas, los resultados de laboratorio e imágenes, la facturación con convenios y los reportes gerenciales en una sola plataforma segura; **a diferencia de** los registros en papel, las hojas de cálculo dispersas y la agenda telefónica, **que** fragmentan la información del paciente, generan errores de medicación, saturan la atención telefónica y retrasan la facturación y los reportes gerenciales.

## 2.2. Perfiles de usuario (stakeholders)
| Perfil | Necesidad principal | Módulo relacionado |
| :--- | :--- | :--- |
| **Admisión / Recepción** | Registrar pacientes rápidamente, verificar la disponibilidad médica consolidada en tiempo real y agendar/reprogramar citas sin congestión telefónica. | M1. Historia clínica electrónica / M2. Agenda y citas médicas |
| **Médico tratante** | Revisar el historial clínico de los pacientes en consulta de forma rápida y certera, además de registrar diagnósticos. | M1. Historia clínica electrónica |
| **Enfermera** | Consultar órdenes e indicaciones médicas del paciente, registrar el triaje y los signos vitales previos a la consulta. | M1. Historia clínica electrónica |
| **Personal de laboratorio** | Recibir órdenes médicas digitales, registrar los resultados analíticos y adjuntar reportes/imágenes digitales para notificación inmediata. | M3. Laboratorio e imágenes |
| **Cajero / Facturación** | Consultar tarifarios automáticos según el convenio (particular/EPS/SOAT), cobrar copagos y emitir comprobantes correctos para minimizar glosas. | M4. Facturación y convenios |
| **Gerencia médica** | Monitorear en tiempo real indicadores clave como la ocupación de consultorios, el tiempo de espera, la tasa de ausentismo e ingresos por convenio. | M5. Reportes gerenciales |
| **Paciente** | Recibir recordatorios oportunos de su cita por WhatsApp y poder confirmarla o cancelarla respondiendo el mensaje; de forma deseable, agendarse en línea (M6). | M2. Agenda y citas médicas / M6. Portal del paciente |

## 2.3. Factibilidad
* **Técnica:** El proyecto es altamente factible mediante la adopción de un stack de desarrollo web moderno de fuente abierta (Backend en Python/FastAPI, Frontend en React y PostgreSQL como BD relacional). La arquitectura web propuesta garantiza una latencia menor a 2 segundos en la apertura de historias clínicas y almacenamiento seguro con cifrado.
* **Operativa:** Presenta una viabilidad operativa favorable, ya que el sistema responde directamente a los cuellos de botella diarios. La interfaz tendrá principios de usabilidad clara. Se mitigará la resistencia al cambio del personal médico mediante capacitaciones breves y acompañamiento presencial, contando con el patrocinio directo de la Gerencia General.
* **Económica:** Demuestra viabilidad económica al reutilizar la infraestructura existente en San Borja. El ahorro derivado de la reducción de glosas con aseguradoras, la disminución del *no-show* del 18% al 8% y la eliminación del gasto en papel superan con creces el costo moderado del hosting cloud y mantenimiento.
