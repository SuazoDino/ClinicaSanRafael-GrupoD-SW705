# Informe de mitad del Sprint 2 — SICA-CSR (Clínica San Rafael S.A.C.)

Fecha de corte: 2026-11-26 (día 6 de 10). Sprint 2: 19/11 al 02/12 de 2026, 10 días hábiles.

> **Backlog propuesto.** El repositorio no tenía un Sprint Backlog 2. `metricas/sprint2.csv` es una propuesta basada en el plan de release (M3, M4 y M5) más la historia de integración HU09. Los estados reflejan lo que muestra el repositorio al corte: desde el 08/11 no se fusionó ningún pull request. El equipo debe corregir el archivo si hay trabajo terminado fuera del repositorio y volver a ejecutar `metricas_corte.py`.

## 1. Estado del sprint

| Historia | Título | Puntos | Estado al corte | Evidencia |
| :--- | :--- | :---: | :--- | :--- |
| HU09 | Recordatorio 24 h con contrato Notificador (M2 + núcleo) | 5 | En curso: PR #3 abierto, CI en verde, falta la aprobación | [PR #3](https://github.com/SuazoDino/ClinicaSanRafael-GrupoD-SW705/pull/3) |
| HU13 | Registrar orden de laboratorio o imagen (M3) | 5 | Sin rama ni PR | — |
| HU14 | Registrar y consultar resultado digital (M3) | 5 | Sin rama ni PR | — |
| HU15 | Calcular copago según convenio EPS (M4) | 5 | Sin rama ni PR | — |
| HU16 | Dashboard: inasistencia y ocupación (M5) | 3 | Sin rama ni PR | — |

**Comprometidos: 23 pts · Hechos: 0 pts · Restantes: 23 pts.** Según la Definición de Hecho, una historia solo cuenta cuando su PR está aprobado y fusionado; HU09 todavía no lo está.

## 2. Métricas de proceso

**Burndown** (`python metricas/metricas_corte.py metricas/sprint2.csv 2026-11-26`):

```
Dia          Real  Ideal
2026-11-19    23   20.7
2026-11-20    23   18.4
2026-11-23    23   16.1
2026-11-24    23   13.8
2026-11-25    23   11.5
2026-11-26    23    9.2

Dia 6 de 10. Comprometido: 23 pts | Hecho: 0 pts | Restante: 23 pts
Diferencia con el ideal: +13.8 pts -> atrasado
Ritmo: 0.00 pts/dia | Proyeccion al cierre: 0.0 pts de 23
```

**Tiempo de ciclo** (`python metricas/tiempo_ciclo.py metricas/prs.csv`):

```
PR    Historia  Dias
#1    T04-CI     0.0
#2    HU10       0.0

Pull requests fusionados: 2
Tiempo de ciclo: mediana 0.0 dias | maximo 0.0 dias
```

- En el Sprint 2 todavía no se fusionó ningún PR. Los únicos fusionados son el #1 (33 min) y el #2 (15 min), ambos del 08/11. El más lento fue el #1.
- En los dos casos la aprobación llegó entre 12 y 16 segundos antes de fusionar. Un ciclo tan corto sugiere una revisión superficial, no un proceso rápido.
- El PR #3 se abrió el 26/11 a las 20:32 y espera revisión. Es el que hay que vigilar.

## 3. Métricas de producto

Medidas sobre la rama de HU09 ya actualizada con `main`, que es el estado que tendrá `main` al fusionar el PR #3. Comandos: `pytest --cov=app --cov-branch --cov-report=term-missing -q` y `radon cc app -s -a`.

| Métrica | Umbral | Resultado | ¿Cumple? |
| :--- | :--- | :--- | :---: |
| Pruebas | Todas en verde | 53 aprobadas, 0 fallidas | Sí |
| Cobertura con ramas, módulos nuevos | ≥ 90 % | `recordatorios.py` 100 %, `contrato.py` 100 % | Sí |
| Cobertura con ramas, total | ≥ 90 % | 89 % | No |
| Complejidad ciclomática máxima | ≤ 10 por función | 14 (`hce_servicio.obtener`, grado C); promedio 2.1 (A) | No |
| Defectos abiertos al cierre | 0 | 0 abiertos; 1 hallado y corregido (CP-09) | Sí |

- Los módulos con menos cobertura son `nucleo/notificaciones/proveedor.py` (31 %: envío real por Twilio y SMTP), `base_datos.py` (53 %), `recordatorio_programador.py` (55 %) y `paciente_servicio.py` (58 %).
- Mutaciones manuales: cambiar `<=` por `<` en la ventana de 24 h lo detecta CP-01. Quitar `not c.recordada` lo detectan CP-07 y `test_envio_exitoso_usa_el_contrato_y_no_se_repite`. Las dos mutaciones fueron detectadas.

## 4. Riesgos y decisiones

- **Riesgo:** al día 6 van 0 de 23 puntos y la proyección es 0. **Decisión:** pedir al Product Owner que pase HU14 y HU16 (8 pts) al Sprint 3 y que el sprint se enfoque en HU09, HU13 y HU15 (15 pts). Se fusiona HU09 el 27/11. **Responsable:** Zamudio (SM) con Suazo (PO).
- **Riesgo:** HU09 y HU10 modificaron las mismas líneas de `cita_servicio.py` (`reprogramar`). **Decisión:** el conflicto se resolvió en la rama de HU09 conservando los dos cambios: primero la validación de HU10 y después la anulación del recordatorio. A partir de ahora, toda rama que dure más de un día integra `main` cada día. **Responsable:** Fernandez.
- **Riesgo:** la cobertura total (89 %) está por debajo del umbral. **Decisión:** agregar pruebas con un notificador simulado para `proveedor.py` y `recordatorio_programador.py`. **Responsable:** Zamudio.
- **Riesgo:** `hce_servicio.obtener` tiene complejidad 14. **Decisión:** dividirla en funciones por sección de la HCE, cada una con su prueba, sin cambiar el contrato de la API. **Responsable:** Suazo.
- **Riesgo:** las aprobaciones de PR llegan segundos antes de fusionar. **Decisión:** el revisor deja al menos un comentario sobre las pruebas o los casos límite antes de aprobar. **Responsable:** todo el equipo.

## 5. Plan hasta el cierre del sprint

| Día | Fecha | Qué se hace |
| :---: | :--- | :--- |
| 7 | 27/11 | Revisar y fusionar el PR #3 (HU09). Fusionar este informe. Reunión con el PO para recortar el alcance. Crear la rama de HU13. |
| 8 | 30/11 | HU13: modelo, migración y endpoint de la orden de laboratorio con TDD. Empezar HU15. |
| 9 | 01/12 | Fusionar HU13. HU15: cálculo de copago con casos límite. Pruebas de `proveedor.py`. |
| 10 | 02/12 | Fusionar HU15, volver a ejecutar las métricas, Sprint Review y Retrospectiva. |

**Pedidos al Product Owner:** aprobar el recorte (HU14 y HU16 pasan al Sprint 3) y definir las tarifas por convenio de M4, que todavía no existen en el modelo de datos.
