# 9. Matriz de trazabilidad

Cada historia del Sprint 1 nace de una necesidad del caso empresarial y llega hasta una tarea con responsable. Si una fila no tuviera necesidad, sería trabajo sin justificación; si no llegara a una tarea, sería un requerimiento que nadie construiría.

## 9.1. Necesidades del negocio
| ID | Necesidad (caso empresarial y acta) |
| :---: | :--- |
| **N1** | Historias clínicas en papel y Excel por especialidad, sin vista unificada: riesgo de errores de medicación. |
| **N2** | Agenda telefónica saturada (20 min por paciente) y riesgo de asignar dos pacientes al mismo cupo. |
| **N3** | 18 % de inasistencia (*no-show*) a las citas. |
| **N4** | Confidencialidad y trazabilidad de la HCE (Ley N.° 29733): nada se borra y todo acceso queda registrado. |

## 9.2. De la necesidad a la tarea del Sprint 1
| Necesidad | Requerimiento | Historia (pts) | Caso de uso | Base de datos | Pantalla | Sprint 1 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| N1 | RF01 | **HU03** Registrar paciente (3) | Registrar paciente «include» Validar DNI único | `paciente` (DNI único), `historia_clinica` | 7.1 Registro de paciente | Sem. 9 · Suazo, Fernandez, Zamudio |
| N2 | RF07, RF09 | **HU01** Ver cupos libres (5) | Agendar cita «include» Consultar cupos libres | `horario_medico`, `cita` | 7.2 Agenda de citas | Sem. 9 · Suazo, Fernandez, Zamudio |
| N2 | RF08 | **HU02** Bloquear cupo ocupado (3) | Agendar cita | `cita` (índice único `ux_cita_cupo`) | 7.2 Agenda de citas | Sem. 9 · Suazo, Fernandez, Zamudio |
| N2 | RF10 | **HU10** Reprogramar o cancelar (3) | Reprogramar o cancelar cita | `cita` (`motivo_cancelacion`, `ck_cita_motivo`) | 7.2 Agenda de citas | Sem. 10 · Fernandez, Zamudio |
| N1 | RF09 | **HU08** Agenda del día del médico (2) | Ver agenda del día | `cita`, `medico` | 7.5 Agenda del médico | Sem. 10 · Fernandez, Zamudio |
| N3 | RF11 | **HU07** Marcar asistencia (2) | Marcar asistencia | `cita.estado` | 7.2 Agenda de citas | Sem. 10 · Fernandez, Zamudio |
| N1 | RF02 | **HU11** Registrar triaje (5) | Registrar triaje | `triaje` (CHECK de rangos) | 7.4 Triaje | Sem. 10 · Zamudio, Fernandez |
| N1 | RF03, RFN02 | **HU04** Consultar HCE unificada (5) | Consultar HCE | `historia_clinica`, `consulta_medica` (`ix_consulta_historia`), `triaje`, `receta` | 7.3 Historia clínica | Sem. 10 · Suazo, Fernandez, Zamudio |
| N1 | RF04 | **HU05** Diagnóstico CIE-10 y receta (3) | Registrar diagnóstico «include» Buscar CIE-10 | `consulta_medica`, `diagnostico_consulta`, `cie10`, `receta` | 7.3 Historia clínica | Sem. 11 · Suazo, Fernandez, Zamudio |
| N4 | RF06, RFN04 | **HU12** Anular entrada con motivo (3) | Anular entrada | `consulta_medica` (`anulada`, `ck_consulta_anulacion`), triggers sin borrado, `bitacora` | 7.3 Historia clínica | Sem. 11 · Suazo, Fernandez, Zamudio |
| N1 | RF04 | **HU06** Imprimir receta (2) | Imprimir receta «extend» Registrar diagnóstico | `receta` | 7.3 Historia clínica | Sem. 11 · Fernandez |
| N3 | RF05 | **HU09** Recordatorio 24 h (5) | Recibir recordatorio «extend» Responder recordatorio | `recordatorio` (`canal`, `estado`, `respuesta`) | WhatsApp; estado visible en 7.2 | Sem. 11 · Zamudio, Suazo |

## 9.3. Atributos de calidad en la arquitectura
Los requerimientos no funcionales no se quedan en la lista: cada uno tiene un mecanismo en el diseño y una forma de verificarlo.

| Necesidad | Requerimiento | Mecanismo en la arquitectura (5) y la BD (6) | Verificación | Tarea |
| :---: | :--- | :--- | :--- | :--- |
| N4 | **RFN01** Acceso por rol y bitácora | JWT + RBAC en el núcleo transversal; tabla `bitacora` inmutable | Pruebas de acceso por rol (HTTP 403) | T03 |
| N1 | **RFN02** HCE en < 2 s con 8 000 pacientes | Índice `ix_consulta_historia`; una sola base PostgreSQL | Prueba de carga con Locust (p95) | T06 |
| — | **RFN03** Disponibilidad 99.5 % | Contenedor con health check y respaldo diario | Health checks | T05 *(pendiente)* |
| N4 | **RFN04** Sin borrado físico | Anulación lógica y triggers `trg_no_delete_*` | Pruebas de triggers | T02 |
| N2 | **RFN05** Máximo 3 clics | SPA con menú por rol | Prueba de usabilidad (SUS > 80) | HU de UI |

## 9.4. Un hilo de punta a punta (ejemplo)
**N2** Evitar citas dobles en recepción → **RF08** Registrar citas impidiendo un cupo ocupado → **HU02** Bloquear cupo ocupado (3 pts) → caso de uso **Agendar cita** (actor: recepcionista) → tabla **`cita`** con el índice único `ux_cita_cupo` (médico + fecha + hora, solo citas no canceladas) → pantalla **7.2 Agenda de citas**, donde el cupo ocupado aparece tachado → **Sprint 1, semana 9**, responsables Suazo (BD/API), Fernandez (UI) y Zamudio (pruebas).

Por eso existe la restricción de unicidad en `cita`: es la respuesta a la necesidad N2, y la BD la garantiza aunque dos recepcionistas elijan el mismo cupo al mismo tiempo.
