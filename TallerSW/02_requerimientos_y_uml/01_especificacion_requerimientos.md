# 3. Especificación de requerimientos (ERS)

## 3.1. Requerimientos funcionales
| ID | Descripción | Módulo | Prioridad |
| :--- | :--- | :---: | :---: |
| **RF01** | Registrar, consultar y actualizar la filiación del paciente asignando HCE única. | M1 | Must |
| **RF02** | Registrar triaje y funciones vitales (PA, FC, Temp, Peso, Talla). | M1 | Should |
| **RF03** | El sistema debe permitir al médico consultar y desplegar el expediente clínico unificado (antecedentes, diagnósticos y atenciones previas) del paciente. | M1 | Must |
| **RF04** | Registrar atenciones médicas con codificación diagnóstica CIE-10. | M1 | Must |
| **RF05** | Mandar recordatorios vía WhatsApp o SMS para que el usuario no olvide su cita. | M2 | Must |
| **RF06** | Anular entradas de la HCE indicando motivo, sin eliminarlas físicamente. | M1 | Must |
| **RF07** | Mostrar los cupos libres consolidados por especialidad, médico y fecha. | M2 | Must |
| **RF08** | Registrar citas impidiendo asignar un cupo ya ocupado. | M2 | Must |
| **RF09** | Visualizar disponibilidad médica consolidada por especialista y fecha. | M2 | Must |
| **RF10** | Reprogramar o cancelar citas, liberando el cupo de inmediato. | M2 | Must |

## 3.2. Requerimientos no funcionales
| ID | Descripción | Atributo | Verificación |
| :--- | :--- | :--- | :--- |
| **RFN01** | Control RBAC y bitácora de auditoría (Ley N.° 29733). | Seguridad | Validación de tokens JWT y logs de auditoría en BD. |
| **RFN02** | Apertura de HCE <2s para base de 8000 pacientes. | Rendimiento | Pruebas de carga con Apache JMeter / Locust. |
| **RFN03** | Disponibilidad del 99.5% durante el horario de atención. | Disponibilidad | Pings automatizados y Health Checks en segundo plano. |
| **RFN04** | Prohibido borrado físico (soft delete obligatorio). | Trazabilidad | Triggers y restricciones SQL a nivel de base de datos. |
| **RFN05** | Máximo 3 clics para operaciones principales. | Usabilidad | Pruebas de usabilidad y métrica SUS > 80. |

## 3.3. Historias de usuario (con criterios de aceptación INVEST)
* **HU01 (8 pts) Como Recepcionista quiero registrar los datos del paciente para crear su HCE.**
  * *Criterio:* Dado un DNI nuevo, cuando se guarden los datos, se asignará un número de HCE único en <2s.
* **HU02 (5 pts) Como Médico quiero añadir contexto a la historia clínica del paciente para tener un mejor registro de su diagnóstico.**
  * *Criterio:* Dada una nueva consulta, cuando el paciente comente su experiencia y atraviesa ciertos exámenes, entonces se registrará eso como parte de su HCE.
* **HU03 (3 pts) Como recepcionista, quiero reprogramar o cancelar una cita, para liberar el cupo y reasignarlo.**
  * *Criterio:* Dado una cita programada, cuando la cancelo indicando el motivo, entonces el cupo vuelve a mostrarse como disponible.
* **HU04 (5 pts) Como paciente, quiero recibir un recordatorio 24 h antes de mi cita, para no faltar o cancelarla a tiempo.**
  * *Criterio:* Dado una cita para mañana, cuando faltan 24 h, entonces recibo un mensaje con fecha, hora y médico, y la opción de confirmar o cancelar.
* **HU05 (5 pts) Como recepcionista quiero registrar a un paciente con su DNI, para evitar historias clínicas duplicadas.**
  * *Criterio:* Dado un DNI ya registrado, cuando intento registrarme otra vez, entonces el sistema me muestra el paciente existente.
* **HU06 (8 pts) Como médico, quiero consultar en una sola vista los antecedentes, alergias y atenciones previas del paciente, para evitar errores de medicación.**
  * *Criterio:* Dado un paciente atendido en Cardiología y Medicina Interna, cuando abro su HCE, entonces veo ambas atenciones con sus recetas en menos de 2 s.
* **HU07 (8 pts) Como médico, quiero registrar el diagnóstico con el catálogo CIE-10 y la receta, para dejar la atención codificada y legible.**
  * *Criterio:* Dada una consulta abierta, cuando busco «diabetes», entonces el sistema sugiere códigos CIE-10 (p. ej., E11) y guarda el elegido con la receta.
* **HU08 (5 pts) Como enfermera quiero registrar los signos vitales en el triaje, para que el médico los vea sin volver a tomarlos.**
  * *Criterio:* Dado un paciente en espera, cuando registré sus signos vitales, entonces aparecen en la consulta del médico y la cita pasa a <<Triado>>.

## 3.4. Product backlog priorizado (MoSCoW)
| ID | Historia (resumen) | Módulo | Sprint | Puntos |
| :---: | :--- | :---: | :---: | :---: |
| **HU01** | Ver cupos libres consolidados | M2 | 1 | 5 |
| **HU02** | Bloquear cupo ocupado | M2 | 1 | 3 |
| **HU03** | Registrar paciente con DNI único | M1 | 1 | 3 |
| **HU04** | Consultar HCE unificada | M1 | 1 | 5 |
| **HU05** | Registrar diagnósticos CIE-10 y receta | M1 | 1 | 3 |
| **HU06** | Imprimir receta médica | M1 | 1 | 2 |
| **HU07** | Marcar asistencia o inasistencia del paciente | M2 | 1 | 2 |
| **HU08** | Ver agenda del día del médico | M2 | 1 | 2 |
| **HU09** | Recordatorio automático de cita | M2 | 1 | 5 |
| **HU10** | Programar o cancelar cita | M2 | 1 | 3 |
| **HU11** | Registrar triaje y signos vitales | M1 | 1 | 5 |
