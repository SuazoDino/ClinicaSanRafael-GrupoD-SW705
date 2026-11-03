# 8. Plan de release y Sprint Backlog

## 8.1. Plan de release
* **Sprint 1 (Semanas 9–11):** Módulo de Registro de Pacientes y HCE Unificada (M1) + Módulo de Agenda de Citas con Recordatorios Automáticos (M2).
* **Sprint 2 (Semanas 12–14):** Módulo de Resultados de Laboratorio/Imágenes (M3) + Módulo de Facturación y Copagos EPS (M4) + Dashboard Gerencial (M5).

## 8.2. Sprint Backlog 1
| Historia | Descripción | Responsable | Puntos | Estado |
| :--- | :--- | :--- | :---: | :---: |
| **HU03** | Registrar paciente con DNI única | Suazo (BD), Fernandez (API/UI), Zamudio (Pruebas) | 3 | Por hacer |
| **HU01 / HU02** | Ver cupos libres y bloquear ocupados | Suazo (BD/API), Fernandez (UI), Zamudio (Datos/Pruebas) | 5 / 3 | Por hacer |
| **HU04** | Consultar HCE unificada | Suazo (BD/Seguridad), Fernandez (UI), Zamudio (Carga) | 5 | Por hacer |

## 8.3. Definición de Hecho (Definition of Done)
1. Código integrado a la rama principal mediante pull request revisado y aprobado.
2. Pruebas unitarias aprobadas en integración continua (GitHub Actions).
3. Criterios de aceptación verificados por QA con evidencia.
4. Sin errores abiertos de prioridad alta.
5. Endpoint documentado en OpenAPI, protegido por rol y registrado en bitácora.
6. Sin borrado físico en tablas clínicas y pruebas realizadas con datos ficticios.
