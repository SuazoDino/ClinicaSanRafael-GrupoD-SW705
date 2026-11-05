# Contrato de la API · Sprint 1

Qué tiene que devolver cada endpoint para que las pantallas del prototipo funcionen sin cambios.
La fuente de verdad es el prototipo: cada función de `frontend/src/modulos/*/api.js` responde hoy desde
`compartido/prototipo/bdPrueba.js` **con la forma exacta que debe tener la respuesta real**. Si algo de este
documento no cuadra con el `api.js`, manda el `api.js`.

Cómo implementar cada endpoint: `GUIA_DESARROLLO.md` (ejemplo completo: `rutas/pacientes.py`).

## Estado

| Capa | Estado |
| :--- | :--- |
| Modelos (`modelos/`) | ✅ Completos y alineados con `db/sql/sica_esquema_datos.sql`. No hace falta tocarlos. |
| Auth, RBAC, bitácora (`nucleo/`) | ✅ Listos (`requiere_roles`, `AuditorActual`, `Sesion`). |
| HU03 Pacientes | ✅ Esquema, servicio y rutas hechos. Es el ejemplo a copiar. |
| Resto de esquemas / servicios / rutas (M1 y M2) | ✅ Implementados según este contrato, con pruebas en `pruebas/`. |
| Frontend | ✅ M1 y M2 conectados a la API real. Solo `administracion` sigue en la BD simulada (fuera del Sprint 1). |
| Datos de ejemplo | ✅ `db/cargar_datos_prueba.py` carga la agenda de ejemplo del prototipo la primera vez (tabla `cita` vacía). |

Orden sugerido (cada paso desbloquea el siguiente): **M2 disponibilidad → citas → agenda médico → M1 triaje → CIE-10 → consultas → historias → recordatorios.**

## Convenciones

- Prefijo `/api` (lo pone `api/rutas.py`). Fechas `YYYY-MM-DD`, horas `HH:MM:SS`, fecha-hora ISO 8601.
- Errores: el servicio lanza `NoEncontrado` (404), `Conflicto` (409), etc. de `nucleo/excepciones.py`. El frontend muestra
  el campo `detail` tal cual, así que **escribe el mensaje para el usuario** (los textos del prototipo sirven).
- **Decimales:** Pydantic serializa `Decimal` como texto (`"36.5"`). En los esquemas de **salida** usa `float`
  para `temperatura`, `peso_kg` y `talla_cm`.
- Cada escritura sobre datos clínicos: `auditor.registrar(...)` antes del `db.commit()`. Nada se borra.
- Un módulo cambia tablas de otro **solo a través de sus servicios** (M1 cambia el estado de la cita con
  `cita_servicio.cambiar_estado`).
- Roles: matriz del ERS 3.5. Ningún rol entra a todo.

### Objetos que se repiten

```jsonc
// Medico
{ "id_medico": 1, "nombres": "Ana", "apellidos": "Ríos", "colegiatura": "CMP12345",
  "id_especialidad": 2, "especialidad": "Cardiología" }      // especialidad = nombre (texto)

// PacienteResumen (dentro de una cita)
{ "id_paciente": 5, "dni": "12345678", "nombres": "...", "apellidos": "...",
  "fecha_nacimiento": "1980-03-01", "telefono": "999...", "numero_hce": "HCE-000005" }

// Triaje
{ "id_triaje": 1, "id_cita": 9, "registrado_por": 3, "fecha_registro": "2026-11-04T09:12:00",
  "presion_sistolica": 120, "presion_diastolica": 80, "frecuencia_cardiaca": 72,
  "temperatura": 36.5, "peso_kg": 70.0, "talla_cm": 168.0 }

// CitaSalida — la usan casi todos los endpoints de M2
{ "id_cita": 9, "id_paciente": 5, "id_medico": 1, "fecha": "2026-11-04", "hora": "09:00:00",
  "estado": "registrada",             // registrada | confirmada | triada | atendida | cancelada | inasistente
  "motivo_cancelacion": null,
  "paciente": PacienteResumen,
  "medico": Medico,
  "recordatorio": { "id_recordatorio": 1, "id_cita": 9, "canal": "whatsapp",
                    "fecha_programada": "2026-11-03T09:00:00", "estado": "pendiente", "respuesta": null } | null,  // el último
  "triaje": Triaje | null }
```

Flujo de estados de la cita: `registrada` →(asistencia)→ `confirmada` →(triaje)→ `triada` →(consulta)→ `atendida`.
También `registrada` → `inasistente`, y `registrada|confirmada` → `cancelada`.

## M2 · Agenda

Archivos: `m2_agenda/esquemas/*.py`, `m2_agenda/servicios/*.py`, `m2_agenda/rutas/*.py`.

| HU | Método y ruta | Rol | Entrada | Respuesta | Errores |
| :-: | :--- | :--- | :--- | :--- | :--- |
| — | `GET /disponibilidad/especialidades` | recepcionista | — | `[{id_especialidad, nombre}]` ordenado por nombre | |
| — | `GET /disponibilidad/medicos?id_especialidad=` | recepcionista | `id_especialidad` opcional | `[Medico]` | |
| HU01 | `GET /disponibilidad?id_medico=&fecha=` | recepcionista | | `[{hora, estado}]`, `estado` = `libre` \| `ocupado` \| `pasado` | |
| HU01 | `GET /disponibilidad/dias?desde=&cantidad=6` | recepcionista | | `["2026-11-04", ...]`: próximos días (máx. 30) con algún horario | |
| — | `GET /citas?fecha=&id_medico=` | recepcionista | ambos opcionales | `[CitaSalida]` por hora, luego id_medico | |
| — | `GET /citas?id_paciente=` | recepcionista | | `[CitaSalida]` con `fecha >= hoy`, por fecha y hora | |
| HU02 | `POST /citas` | recepcionista | `{id_paciente, id_medico, fecha, hora}` | `201 CitaSalida` (estado `registrada`) | **409** cupo tomado |
| HU10 | `PUT /citas/{id}/reprogramar` | recepcionista | `{fecha, hora}` | `CitaSalida` (vuelve a `registrada`) | 404 · 409 si no está `registrada/confirmada` o cupo ocupado |
| HU10 | `PUT /citas/{id}/cancelar` | recepcionista | `{motivo}` (1–200) | `CitaSalida` (`cancelada`) | 404 · 422 sin motivo · 409 si no está `registrada/confirmada` |
| HU07 | `PUT /citas/{id}/asistencia` | recepcionista | `{asistio: bool}` | `CitaSalida` (`confirmada` o `inasistente`) | 404 · 409 si no está `registrada` |
| HU09 | `POST /recordatorios/respuesta` | — (webhook de Twilio, sin JWT; valida `X-Twilio-Signature`) | formulario `From`, `Body` (`1` confirma, `2` cancela) | TwiML con el mensaje de respuesta | 403 firma inválida |
| HU08 | `GET /agenda-medico?fecha=&id_medico=` | medico, recepcionista | `fecha` por defecto hoy | `[CitaSalida]` sin canceladas, por hora | 403 si un médico pide otro `id_medico` |

Reglas:
- **Cupos (HU01):** desde `horario_medico` del `dia_semana` de la fecha (1 = lunes … 7 = domingo), de `hora_inicio`
  a `hora_fin` en pasos de `duracion_cupo_min`. `ocupado` = existe cita no cancelada en ese médico/fecha/hora;
  `pasado` = fecha/hora ya pasaron.
- **Cupo duplicado (HU02):** no basta con revisar antes de insertar. El índice único `ux_cita_cupo` es la garantía:
  captura `IntegrityError` → `Conflicto("Ese cupo acaba de ser tomado. Elige otro horario.")`.
- **Recordatorio (HU09):** al crear o reprogramar una cita, insertar un `recordatorio` con
  `fecha_programada = fecha+hora − 24 h`, `canal = 'whatsapp'`, `estado = 'pendiente'`.
- **Agenda médico (HU08):** si el rol es `medico`, el `id_medico` sale de `medico.id_usuario = usuario actual`
  (se ignora el query). Si es `recepcionista`, `id_medico` es obligatorio.
- **Expón para M1** en `cita_servicio`: `cambiar_estado(db, id_cita, desde: tuple[str, ...], hacia: str)` → 404 / 409
  `"La cita está «X» y no puede pasar a «Y»."`.
- **HU09 · `recordatorio_servicio.procesar_pendientes`:** ya lo llama el programador. Enviar con
  `nucleo/notificaciones/proveedor.enviar_mensaje()` el mensaje con fecha, hora y médico; marcar `enviado`/`fallido`.

## M1 · HCE

Archivos: `m1_hce/esquemas/*.py`, `m1_hce/servicios/*.py`, `m1_hce/rutas/*.py`.

| HU | Método y ruta | Rol | Entrada | Respuesta | Errores |
| :-: | :--- | :--- | :--- | :--- | :--- |
| HU03 | `/pacientes` (GET, GET {id}, POST, PUT) | ✅ ya hecho | | | |
| HU11 | `GET /triajes/pendientes?fecha=` | enfermera, administrador | `fecha` por defecto hoy | `[CitaSalida]` en estado `confirmada` o `triada`, por hora | |
| HU11 | `POST /triajes` | enfermera | `{id_cita, presion_sistolica, presion_diastolica, frecuencia_cardiaca, temperatura, peso_kg, talla_cm}` | `201 Triaje` | 422 fuera de rango · 409 ya tiene triaje / cita no `confirmada` |
| HU05 | `GET /cie10?texto=` | medico | `texto` mín. 2 | `[{codigo, descripcion}]`, máx. 8: código que empieza por, o descripción que contiene | |
| HU05 | `POST /consultas` | medico | ver abajo | `201 Consulta` | 422 · 409 si la cita no está `confirmada/triada` |
| HU12 | `PUT /consultas/{id}/anular` | medico | `{motivo}` (1–300) | `Consulta` anulada | 404 · 409 ya anulada · 422 sin motivo |
| HU04 | `GET /historias/{id_paciente}` | medico | | ver abajo | 404 |

Rangos del triaje (mismos CHECK de la BD, ya en `RANGOS_TRIAJE` del frontend):
sistólica 50–300 · diastólica 30–200 · FC 20–250 · temperatura 30–45 · peso 0.5–400 · talla 30–250.

**`POST /consultas`** — la cita pasa a `atendida`:

```jsonc
{ "id_cita": 9, "motivo": "Dolor torácico",       // 1–300, obligatorio
  "evolucion": "..." | null,
  "diagnosticos": [{ "codigo_cie10": "I20.9", "es_principal": true }],  // ≥1 y exactamente 1 principal
  "indicaciones": "Ácido acetilsalicílico 100 mg ..." | null }         // si viene, se crea la receta
```

`id_historia` se obtiene de la cita → paciente → historia (no lo manda el frontend).

**Consulta** (respuesta de POST, de anular y dentro de la HCE):

```jsonc
{ "id_consulta": 1, "id_cita": 9, "id_historia": 5, "fecha_consulta": "2026-11-04T10:00:00",
  "motivo": "...", "evolucion": "...",
  "anulada": false, "motivo_anulacion": null, "anulada_por": null, "fecha_anulacion": null }
```

**`GET /historias/{id_paciente}`** (HU04 · debe responder en < 2 s con 8 000 pacientes; carga relaciones con
`selectinload`, no en bucle). Registrar la lectura en bitácora.

```jsonc
{ "paciente": PacienteSalida,                // el mismo de /pacientes/{id}
  "antecedentes": "..." | null, "alergias": "..." | null,
  "triaje_reciente": Triaje | null,          // el más reciente de cualquier cita del paciente
  "consultas": [                             // todas, incluidas las anuladas, más recientes primero
    { ...Consulta,
      "medico": Medico,
      "anulada_por_usuario": "medico" | null, // username de quien anuló
      "diagnosticos": [{ "id_consulta": 1, "codigo_cie10": "I20.9", "es_principal": true,
                         "descripcion": "Angina de pecho, no especificada" }],   // principal primero
      "receta": { "id_receta": 1, "id_consulta": 1, "indicaciones": "...", "fecha_emision": "2026-11-04" } | null } ],
  "citas_por_atender": [ Cita + "medico": Medico ] }  // citas de HOY en estado confirmada o triada
```

HU06 (imprimir receta) es solo frontend: usa los datos de la HCE.

## Pruebas a activar

Quita el `@pytest.mark.skip` al terminar cada historia:

| Prueba | Requiere |
| :--- | :--- |
| `pruebas/unitarias/test_cita_cupo_ocupado.py` | HU02 |
| `pruebas/unitarias/test_rbac.py` (la marcada) | HU04 |
| `pruebas/unitarias/test_anulacion_consulta.py` | HU12 |
| `pruebas/integracion/test_recordatorio_24h.py` | HU09 |
| `pruebas/integracion/test_flujo_agendar_atender.py` | HU01, HU02, HU11, HU05 |

## Conectar el frontend

Cuando un endpoint funciona, en el `api.js` se reemplaza el cuerpo de la función por la llamada `http`
de su comentario, p. ej.:

```js
registrar: (datos) => http.post('/citas', datos).then((r) => r.data),
```

Ojo con dos funciones que hoy reciben más de lo que hay que enviar:
- `citasApi.registrar({ paciente, id_medico, fecha, hora })` → enviar `{ id_paciente: paciente.id_paciente, id_medico, fecha, hora }`.
- `consultasApi.registrar({ paciente, id_cita, ... })` → no enviar `paciente`.

`cambiarEstadoCita` y `recordarPaciente` solo existen para la BD simulada: se eliminan al terminar.

## Fuera del Sprint 1

`modulos/administracion` (Personal, usuarios, especialidades) es prototipo **pendiente de aprobación**
(ERS 3.5, «por aprobar»). No tiene backend todavía; sus endpoints están en los comentarios de
`frontend/src/modulos/administracion/api.js`.
