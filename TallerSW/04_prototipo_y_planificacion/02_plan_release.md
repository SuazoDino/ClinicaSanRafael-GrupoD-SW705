# 8. Plan de release y Sprint Backlog

## 8.1. Plan de release
* **Sprint 1 (Semanas 9–11):** Módulo de Registro de Pacientes y HCE Unificada (M1) + Módulo de Agenda de Citas con Recordatorios Automáticos (M2).
* **Sprint 2 (Semanas 12–14):** Módulo de Resultados de Laboratorio/Imágenes (M3) + Módulo de Facturación y Copagos EPS (M4) + Dashboard Gerencial (M5).

## 8.2. Sprint 1 (Semanas 9–11)

### 8.2.1. Objetivo del sprint
Entregar en producción (nube) el flujo completo de **atención ambulatoria**: recepción registra al paciente y agenda la cita sin cupos duplicados, el paciente recibe su recordatorio, enfermería registra el triaje y el médico abre la HCE unificada en menos de 2 s, registra el diagnóstico CIE-10 con receta y anula entradas con motivo. Todo con acceso por rol y bitácora.

### 8.2.2. Sprint Backlog 1
| Historia | Descripción | Módulo | Responsable | Puntos | Estado |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **HU03** | Registrar paciente con DNI único | M1 | Suazo (BD), Fernandez (API/UI), Zamudio (Pruebas) | 3 | Por hacer |
| **HU01** | Ver cupos libres consolidados | M2 | Suazo (BD/API), Fernandez (UI), Zamudio (Datos/Pruebas) | 5 | Por hacer |
| **HU02** | Bloquear cupo ocupado | M2 | Suazo (BD/API), Fernandez (UI), Zamudio (Pruebas) | 3 | Por hacer |
| **HU10** | Reprogramar o cancelar cita | M2 | Fernandez (API/UI), Zamudio (Pruebas) | 3 | Por hacer |
| **HU08** | Ver agenda del día del médico | M2 | Fernandez (API/UI), Zamudio (Pruebas) | 2 | Por hacer |
| **HU07** | Marcar asistencia o inasistencia | M2 | Fernandez (API/UI), Zamudio (Pruebas) | 2 | Por hacer |
| **HU11** | Registrar triaje y signos vitales | M1 | Zamudio (API), Fernandez (UI) | 5 | Por hacer |
| **HU04** | Consultar HCE unificada | M1 | Suazo (BD/Seguridad), Fernandez (UI), Zamudio (Carga) | 5 | Por hacer |
| **HU05** | Registrar atención con diagnóstico CIE-10 y receta | M1 | Suazo (BD/API), Fernandez (UI), Zamudio (Pruebas) | 3 | Por hacer |
| **HU12** | Anular entrada de la HCE con motivo | M1 | Suazo (BD/API), Fernandez (UI), Zamudio (Pruebas) | 3 | Por hacer |
| **HU06** | Imprimir receta médica | M1 | Fernandez (UI) | 2 | Por hacer |
| **HU09** | Recordatorio automático de cita | M2 | Zamudio (API/Integración), Suazo (BD) | 5 | Por hacer |
| | **Total** | | | **41** | |

### 8.2.3. Tareas técnicas habilitadoras
Son prerrequisitos de las historias; no suman puntos.

| ID | Tarea | Responsable |
| :---: | :--- | :--- |
| **T01** | Estructura del repositorio (`backend`, `frontend`, `db`, `tests`), `docker-compose` con PostgreSQL 16 y proyectos base FastAPI y React + Vite. | Fernandez |
| **T02** | Migración inicial con Alembic a partir del DDL (6.3) y semillas ficticias: roles, usuarios de prueba, especialidades, médicos, horarios, catálogo CIE-10 y 8 000 pacientes para la prueba de carga. | Suazo |
| **T03** | Inicio de sesión con JWT (access + refresh), hash argon2, middleware RBAC por rol y registro automático en bitácora (RFN01). | Suazo |
| **T04** | Integración continua en GitHub Actions: lint, pytest y build del frontend en cada pull request. | Zamudio |
| **T05** | Despliegue en la nube (PaaS + PostgreSQL gestionado) con HTTPS y health check (RFN03). | Zamudio |
| **T06** | Prueba de carga con Locust sobre la apertura de HCE (<2 s p95 con 8 000 pacientes, RFN02). | Zamudio |

### 8.2.4. Cronograma del sprint
| Semana | Entregable interno |
| :---: | :--- |
| **9** | T01–T04 listos. Registro de pacientes (HU03) y agenda con cupos libres y bloqueo de duplicados (HU01, HU02). |
| **10** | Ciclo de la cita: reprogramar/cancelar (HU10), agenda del médico (HU08), asistencia (HU07) y triaje (HU11). HCE unificada (HU04). |
| **11** | Atención médica: diagnóstico CIE-10 y receta (HU05), anulación (HU12), impresión (HU06) y recordatorios (HU09). Prueba de carga (T06), despliegue (T05), Sprint Review y Retrospectiva. |

## 8.3. Definición de Hecho (Definition of Done)
1. Código integrado a la rama principal mediante pull request revisado y aprobado.
2. Pruebas unitarias aprobadas en integración continua (GitHub Actions).
3. Criterios de aceptación verificados por QA con evidencia.
4. Sin errores abiertos de prioridad alta.
5. Endpoint documentado en OpenAPI, protegido por rol y registrado en bitácora.
6. Sin borrado físico en tablas clínicas y pruebas realizadas con datos ficticios.
