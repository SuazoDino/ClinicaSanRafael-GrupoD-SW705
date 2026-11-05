# 3. Especificación de requerimientos (ERS)

## 3.1. Requerimientos funcionales
| ID | Descripción | Módulo | Prioridad |
| :--- | :--- | :---: | :---: |
| **RF01** | Registrar, consultar y actualizar la filiación del paciente asignando HCE única. | M1 | Must |
| **RF02** | Registrar triaje y funciones vitales (PA, FC, Temp, Peso, Talla). | M1 | Should |
| **RF03** | El sistema debe permitir al médico consultar y desplegar el expediente clínico unificado (antecedentes, diagnósticos y atenciones previas) del paciente. | M1 | Must |
| **RF04** | Registrar atenciones médicas con codificación diagnóstica CIE-10. | M1 | Must |
| **RF05** | Enviar recordatorios automáticos de cita por WhatsApp 24 h antes y registrar la respuesta del paciente (confirma o cancela). | M2 | Must |
| **RF06** | Anular entradas de la HCE indicando motivo, sin eliminarlas físicamente. | M1 | Must |
| **RF07** | Mostrar los cupos libres consolidados por especialidad, médico y fecha. | M2 | Must |
| **RF08** | Registrar citas impidiendo asignar un cupo ya ocupado. | M2 | Must |
| **RF09** | Visualizar disponibilidad médica consolidada por especialista y fecha. | M2 | Must |
| **RF10** | Reprogramar o cancelar citas, liberando el cupo de inmediato. | M2 | Must |
| **RF11** | Registrar la asistencia o inasistencia del paciente a su cita, para medir el *no-show*. | M2 | Should |

## 3.2. Requerimientos no funcionales
| ID | Descripción | Atributo | Verificación |
| :--- | :--- | :--- | :--- |
| **RFN01** | Control de acceso por rol (RBAC) según la matriz de la sección 3.5: cada rol accede solo a las funciones de su labor y ninguno tiene acceso total; toda operación sobre datos clínicos queda en la bitácora de auditoría (Ley N.° 29733). | Seguridad | Validación de tokens JWT, pruebas de acceso por rol (HTTP 403 fuera de la matriz) y logs de auditoría en BD. |
| **RFN02** | Apertura de HCE <2s para base de 8000 pacientes. | Rendimiento | Pruebas de carga con Locust (percentil 95). |
| **RFN03** | Disponibilidad del 99.5% durante el horario de atención. | Disponibilidad | Pings automatizados y Health Checks en segundo plano. |
| **RFN04** | Prohibido borrado físico (soft delete obligatorio). | Trazabilidad | Triggers y restricciones SQL a nivel de base de datos. |
| **RFN05** | Máximo 3 clics para operaciones principales. | Usabilidad | Pruebas de usabilidad y métrica SUS > 80. |

## 3.3. Historias de usuario (con criterios de aceptación INVEST)
Los identificadores y puntos de esta sección son los mismos del product backlog (3.4) y del Sprint Backlog (8.2).

* **HU01 (5 pts) Como recepcionista, quiero ver los cupos libres consolidados por especialidad, médico y fecha, para agendar en menos de 3 minutos.** *(RF07, RF09)*
  * *Criterio:* Dada una especialidad y una fecha, cuando consulto la agenda, entonces veo por médico los cupos libres y ocupados según su horario de atención.
* **HU02 (3 pts) Como recepcionista, quiero que el sistema bloquee los cupos ocupados, para no asignar dos pacientes al mismo horario.** *(RF08)*
  * *Criterio:* Dado un cupo ya reservado, cuando intento registrar otra cita en el mismo médico, fecha y hora, entonces el sistema rechaza la operación (HTTP 409) y me pide elegir otro cupo.
* **HU03 (3 pts) Como recepcionista, quiero registrar a un paciente con su DNI, para crear su HCE sin duplicados.** *(RF01)*
  * *Criterio 1:* Dado un DNI nuevo, cuando guardo los datos, entonces se crea el paciente con un número de HCE único en menos de 2 s.
  * *Criterio 2:* Dado un DNI ya registrado, cuando intento registrarlo otra vez, entonces el sistema me muestra el paciente y la HCE existentes.
* **HU04 (5 pts) Como médico, quiero consultar en una sola vista los antecedentes, alergias y atenciones previas del paciente, para evitar errores de medicación.** *(RF03, RFN02)*
  * *Criterio:* Dado un paciente atendido en Cardiología y Medicina Interna, cuando abro su HCE, entonces veo ambas atenciones con sus diagnósticos y recetas en menos de 2 s.
* **HU05 (3 pts) Como médico, quiero registrar la atención con diagnóstico CIE-10 y receta, para dejar la consulta codificada y legible.** *(RF04)*
  * *Criterio:* Dada una cita triada, cuando busco «diabetes», entonces el sistema sugiere códigos CIE-10 (p. ej., E11), y al guardar queda la consulta con motivo, evolución, diagnóstico principal y receta, y la cita pasa a «atendida».
* **HU06 (2 pts) Como médico, quiero imprimir la receta, para entregársela al paciente.** *(RF04)*
  * *Criterio:* Dada una consulta con receta, cuando pulso «Imprimir», entonces se genera un formato imprimible con los datos del paciente, médico, diagnóstico e indicaciones.
* **HU07 (2 pts) Como recepcionista, quiero marcar la asistencia o inasistencia del paciente, para medir el no-show.** *(RF11)*
  * *Criterio:* Dada una cita del día, cuando marco «no asistió», entonces la cita pasa a «inasistente»; si asistió, queda «confirmada» y disponible para triaje.
* **HU08 (2 pts) Como médico, quiero ver mi agenda del día, para saber a qué pacientes atiendo y en qué estado están.** *(RF09)*
  * *Criterio 1:* Dado que inicio sesión como médico, cuando abro «Mi agenda», entonces veo solo mis citas del día ordenadas por hora con su estado.
  * *Criterio 2:* Dado que inicio sesión como recepcionista, cuando abro «Agenda por médico» y elijo un médico, entonces veo sus citas del día con su estado, en solo lectura y sin acceso a la HCE.
* **HU09 (5 pts) Como paciente, quiero recibir un recordatorio 24 h antes de mi cita, para no faltar o cancelarla a tiempo.** *(RF05)*
  * *Criterio:* Dada una cita para mañana, cuando faltan 24 h, entonces recibo un mensaje con fecha, hora y médico, y puedo responder «1» para confirmar o «2» para cancelar; si cancelo, la cita pasa a «cancelada» y el cupo se libera, y si confirmo, mi confirmación queda registrada en el recordatorio.
* **HU10 (3 pts) Como recepcionista, quiero reprogramar o cancelar una cita, para liberar el cupo y reasignarlo.** *(RF10)*
  * *Criterio:* Dada una cita registrada, cuando la cancelo indicando el motivo, entonces el cupo vuelve a mostrarse como disponible.
* **HU11 (5 pts) Como enfermera, quiero registrar los signos vitales en el triaje, para que el médico los vea sin volver a tomarlos.** *(RF02)*
  * *Criterio:* Dado un paciente en espera, cuando registro sus signos vitales, entonces aparecen en la consulta del médico y la cita pasa a «triada».
* **HU12 (3 pts) Como médico, quiero anular una entrada de la HCE indicando el motivo, para corregir errores sin perder la trazabilidad.** *(RF06, RFN04)*
  * *Criterio:* Dada una consulta registrada por error, cuando la anulo con motivo, entonces se muestra como «anulada» con autor y fecha, sigue visible en la HCE y no se puede borrar físicamente.

## 3.4. Product backlog priorizado (MoSCoW)
| ID | Historia (resumen) | Módulo | MoSCoW | Sprint | Puntos |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **HU01** | Ver cupos libres consolidados | M2 | Must | 1 | 5 |
| **HU02** | Bloquear cupo ocupado | M2 | Must | 1 | 3 |
| **HU03** | Registrar paciente con DNI único | M1 | Must | 1 | 3 |
| **HU04** | Consultar HCE unificada | M1 | Must | 1 | 5 |
| **HU05** | Registrar atención con diagnóstico CIE-10 y receta | M1 | Must | 1 | 3 |
| **HU06** | Imprimir receta médica | M1 | Could | 1 | 2 |
| **HU07** | Marcar asistencia o inasistencia del paciente | M2 | Should | 1 | 2 |
| **HU08** | Ver agenda del día del médico | M2 | Should | 1 | 2 |
| **HU09** | Recordatorio automático de cita | M2 | Must | 1 | 5 |
| **HU10** | Reprogramar o cancelar cita | M2 | Must | 1 | 3 |
| **HU11** | Registrar triaje y signos vitales | M1 | Should | 1 | 5 |
| **HU12** | Anular entrada de la HCE con motivo | M1 | Must | 1 | 3 |
| | **Total Sprint 1** | | | | **41** |

## 3.5. Matriz de acceso por rol (RFN01)
Cada rol accede solo a lo que necesita para su labor. El administrador **no** tiene acceso total: gestiona a las personas y los catálogos de la clínica, pero no registra ni consulta datos clínicos de la HCE (confidencialidad, Ley N.° 29733). Los indicadores que necesita para supervisar el negocio los obtiene de forma agregada en el Dashboard Gerencial (M5, Sprint 2).

| Función | Recepcionista | Enfermera | Médico | Administrador |
| :--- | :---: | :---: | :---: | :---: |
| Registrar, buscar y actualizar la filiación del paciente (HU03, RF01) | Registra | — | — | Registra |
| Cupos libres, agendar, reprogramar, cancelar y asistencia (HU01, HU02, HU07, HU10) | Registra | — | — | — |
| Agenda del día por médico (HU08) | Consulta (cualquier médico) | — | Consulta (solo la suya) | — |
| Triaje y signos vitales (HU11) | — | Registra | Consulta en la HCE | Consulta (solo lectura) |
| HCE unificada, consulta CIE-10, receta y anulación (HU04, HU05, HU06, HU12) | — | — | Registra | — |
| Personal y usuarios: médicos y su horario, enfermería, recepción; activar o desactivar accesos y restablecer contraseñas | — | — | — | Registra *(por aprobar)* |
| Catálogo de especialidades | — | — | — | Registra *(por aprobar)* |
| Facturación y copagos EPS (M4) | Por definir | — | — | Por definir *(Sprint 2)* |
| Indicadores del Dashboard Gerencial (M5) | — | — | — | Consulta *(Sprint 2)* |

* **Registra:** crea o modifica información. **Consulta:** solo lectura. **—:** sin acceso (la API responde HTTP 403).
* **Filiación** son los datos personales (DNI, nombres, nacimiento, contacto); no incluye antecedentes, alergias ni atenciones, que son parte de la HCE.
* **Por aprobar:** la gestión de personal, usuarios y especialidades no está en el Sprint 1 ni en el 2; existe como prototipo y se decidirá al cierre del proyecto. Usa tablas que ya existen (`medico`, `horario_medico`, `especialidad`, `usuario`, `rol`).
* **Fuera de alcance por ahora:** sedes y tarifas no existen en el modelo de datos ni están definidas; se especificarán junto con la facturación (M4).
