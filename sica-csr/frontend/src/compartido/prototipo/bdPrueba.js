// PROTOTIPO · Base de datos simulada en el navegador para las pantallas cuyo endpoint aún no existe.
//
// Usa las mismas tablas, columnas y reglas que la BD real (TallerSW/03_arquitectura_y_base_de_datos/02_modelo_base_de_datos.md):
// estados de cita, cupo único por médico/fecha/hora, motivo obligatorio al cancelar o anular, rangos de signos
// vitales, un diagnóstico principal por consulta y nada se borra. Médicos, especialidades, horarios, CIE-10 y los
// pacientes 1–10 son copia de las semillas (T02).
//
// Cómo se retira: cuando un endpoint quede listo, en api.js del módulo se cambia la función simulada por la
// llamada http (misma firma y misma forma de respuesta) y las pantallas no se tocan. Al final se borra esta carpeta.
//
// Los cambios se guardan en localStorage y se reinician cada día (o con reiniciarPrototipo()).
import { diaSemana, hoyISO, sumarDias } from '../utilidades/formato.js'

const CLAVE = 'sica_prototipo_v3'
const DEMORA_MS = 200

// ===== Catálogos (iguales a las semillas de la BD) =====
const ESPECIALIDADES_SEMILLA = [
  { id_especialidad: 1, nombre: 'Medicina Interna' },
  { id_especialidad: 3, nombre: 'Cardiología' },
  { id_especialidad: 5, nombre: 'Pediatría' },
  { id_especialidad: 6, nombre: 'Ginecología' },
  { id_especialidad: 7, nombre: 'Dermatología' },
  { id_especialidad: 8, nombre: 'Traumatología' },
]

const MEDICOS_SEMILLA = [
  { id_medico: 1, nombres: 'Carlos', apellidos: 'Ramírez Soto', colegiatura: 'CMP10001', id_especialidad: 1, id_usuario: 4 },
  { id_medico: 2, nombres: 'Lucía', apellidos: 'Vargas Peña', colegiatura: 'CMP10002', id_especialidad: 1, id_usuario: null },
  { id_medico: 3, nombres: 'Jorge', apellidos: 'Mendoza Ríos', colegiatura: 'CMP10003', id_especialidad: 3, id_usuario: 5 },
  { id_medico: 4, nombres: 'Ana', apellidos: 'Torres Quispe', colegiatura: 'CMP10004', id_especialidad: 3, id_usuario: null },
  { id_medico: 5, nombres: 'Rosa', apellidos: 'Flores Huamán', colegiatura: 'CMP10005', id_especialidad: 5, id_usuario: null },
  { id_medico: 6, nombres: 'María', apellidos: 'Castillo León', colegiatura: 'CMP10006', id_especialidad: 6, id_usuario: null },
  { id_medico: 7, nombres: 'Pedro', apellidos: 'Salazar Díaz', colegiatura: 'CMP10007', id_especialidad: 7, id_usuario: null },
  { id_medico: 8, nombres: 'Luis', apellidos: 'Paredes Cano', colegiatura: 'CMP10008', id_especialidad: 8, id_usuario: null },
]

// Todos atienden de lunes a viernes de 08:00 a 13:00 en cupos de 20 min (semillas actuales)
const HORARIOS_SEMILLA = MEDICOS_SEMILLA.flatMap((m) => [1, 2, 3, 4, 5].map((dia) => ({
  id_horario: (m.id_medico - 1) * 5 + dia, id_medico: m.id_medico, dia_semana: dia,
  hora_inicio: '08:00:00', hora_fin: '13:00:00', duracion_cupo_min: 20,
})))

const USUARIOS_SEMILLA = [
  { id_usuario: 1, username: 'admin', rol: 'administrador', activo: true },
  { id_usuario: 2, username: 'recepcion', rol: 'recepcionista', activo: true },
  { id_usuario: 3, username: 'enfermera', rol: 'enfermera', activo: true },
  { id_usuario: 4, username: 'medico', rol: 'medico', activo: true },
  { id_usuario: 5, username: 'cardiologo', rol: 'medico', activo: true },
]

export const CIE10 = [
  ['A09', 'Diarrea y gastroenteritis de presunto origen infeccioso'], ['B34.9', 'Infección viral no especificada'],
  ['E03.9', 'Hipotiroidismo no especificado'], ['E11', 'Diabetes mellitus tipo 2'],
  ['E11.9', 'Diabetes mellitus tipo 2 sin complicaciones'], ['E66.9', 'Obesidad no especificada'],
  ['E78.5', 'Hiperlipidemia no especificada'], ['F32.9', 'Episodio depresivo no especificado'],
  ['F41.1', 'Trastorno de ansiedad generalizada'], ['G43.9', 'Migraña no especificada'],
  ['H10.9', 'Conjuntivitis no especificada'], ['I10', 'Hipertensión esencial (primaria)'],
  ['I20.9', 'Angina de pecho no especificada'], ['I25.1', 'Enfermedad aterosclerótica del corazón'],
  ['I48', 'Fibrilación y aleteo auricular'], ['I50.9', 'Insuficiencia cardíaca no especificada'],
  ['J00', 'Rinofaringitis aguda (resfriado común)'], ['J02.9', 'Faringitis aguda no especificada'],
  ['J03.9', 'Amigdalitis aguda no especificada'], ['J06.9', 'Infección aguda de las vías respiratorias superiores no especificada'],
  ['J18.9', 'Neumonía no especificada'], ['J45.9', 'Asma no especificada'],
  ['K21.9', 'Enfermedad del reflujo gastroesofágico sin esofagitis'], ['K29.7', 'Gastritis no especificada'],
  ['K59.0', 'Estreñimiento'], ['L20.9', 'Dermatitis atópica no especificada'], ['M54.5', 'Lumbago no especificado'],
  ['M79.1', 'Mialgia'], ['N39.0', 'Infección de vías urinarias de sitio no especificado'], ['O80', 'Parto único espontáneo'],
  ['R05', 'Tos'], ['R10.4', 'Otros dolores abdominales y los no especificados'], ['R50.9', 'Fiebre no especificada'],
  ['R51', 'Cefalea'], ['Z00.0', 'Examen médico general'], ['Z01.4', 'Examen ginecológico general de rutina'],
].map(([codigo, descripcion]) => ({ codigo, descripcion }))

// Pacientes 1–10 de las semillas (para las citas de ejemplo); los demás llegan desde la API real de pacientes
const PACIENTES_SEMILLA = [
  [1, '70000001', 'Juan', 'Pérez García', '1985-03-12'], [2, '70000002', 'Carmen', 'López Ruiz', '1992-07-25'],
  [3, '70000003', 'Miguel', 'Sánchez Torres', '1978-11-02'], [4, '70000004', 'Elena', 'Gómez Vega', '2001-01-30'],
  [5, '70000005', 'Raúl', 'Díaz Rojas', '1969-05-18'], [6, '70000006', 'Patricia', 'Morales Chávez', '1995-09-09'],
  [7, '70000007', 'Diego', 'Herrera Luna', '2015-04-21'], [8, '70000008', 'Sofía', 'Ramos Medina', '1988-12-14'],
  [9, '70000009', 'Andrés', 'Cruz Navarro', '1959-08-03'], [10, '70000010', 'Valeria', 'Ortiz Campos', '1999-02-27'],
].map(([id, dni, nombres, apellidos, nac]) => ({
  id_paciente: id, dni, nombres, apellidos, fecha_nacimiento: nac,
  telefono: `+519000000${String(id).padStart(2, '0')}`, numero_hce: `HCE-${String(id).padStart(6, '0')}`,
}))

// ===== Datos de ejemplo (relativos a la fecha de hoy) =====
function crearSemilla() {
  const hoy = hoyISO()
  const bd = {
    fecha_semilla: hoy,
    secuencias: { cita: 0, triaje: 0, consulta: 0, receta: 0, recordatorio: 0, medico: 8, horario: 40, usuario: 5, especialidad: 8 },
    especialidades: structuredClone(ESPECIALIDADES_SEMILLA),
    medicos: structuredClone(MEDICOS_SEMILLA),
    horarios: structuredClone(HORARIOS_SEMILLA),
    usuarios: structuredClone(USUARIOS_SEMILLA),
    pacientes: Object.fromEntries(PACIENTES_SEMILLA.map((p) => [p.id_paciente, p])),
    historias: {
      1: { antecedentes: 'Hipertensión arterial desde 2019.', alergias: null },
      3: { antecedentes: 'Asma en la infancia.', alergias: 'Penicilina' },
      5: { antecedentes: 'Hipertensión arterial. Exfumador.', alergias: 'Sulfas' },
      9: { antecedentes: 'Diabetes mellitus tipo 2 e hiperlipidemia.', alergias: 'Ibuprofeno, Mariscos' },
    },
    citas: [], recordatorios: [], triajes: [], consultas: [], diagnosticos: [], recetas: [],
  }

  const sig = (tabla) => (bd.secuencias[tabla] += 1)
  const cita = (id_paciente, id_medico, fecha, hora, estado = 'registrada', motivo_cancelacion = null) => {
    const c = { id_cita: sig('cita'), id_paciente, id_medico, fecha, hora: `${hora}:00`, estado, motivo_cancelacion }
    bd.citas.push(c)
    const programada = `${sumarDias(fecha, -1)}T${hora}:00`
    bd.recordatorios.push({
      id_recordatorio: sig('recordatorio'), id_cita: c.id_cita, canal: id_paciente % 2 ? 'whatsapp' : 'sms',
      fecha_programada: programada, estado: fecha <= sumarDias(hoy, 1) ? 'enviado' : 'pendiente',
      respuesta: estado === 'cancelada' ? 'cancela' : fecha <= hoy && id_paciente % 3 !== 0 ? 'confirma' : null,
    })
    return c
  }
  const triaje = (c, pa, pd, fc, t, peso, talla, registrado_por = 3) => bd.triajes.push({
    id_triaje: sig('triaje'), id_cita: c.id_cita, registrado_por, fecha_registro: `${c.fecha}T${c.hora}`,
    presion_sistolica: pa, presion_diastolica: pd, frecuencia_cardiaca: fc, temperatura: t, peso_kg: peso, talla_cm: talla,
  })
  const consulta = (c, motivo, evolucion, diagnosticos, indicaciones, anulacion) => {
    const co = {
      id_consulta: sig('consulta'), id_cita: c.id_cita, id_historia: c.id_paciente, fecha_consulta: `${c.fecha}T${c.hora}`,
      motivo, evolucion, anulada: false, motivo_anulacion: null, anulada_por: null, fecha_anulacion: null,
    }
    if (anulacion) Object.assign(co, { anulada: true, motivo_anulacion: anulacion, anulada_por: 4, fecha_anulacion: `${c.fecha}T12:30:00` })
    bd.consultas.push(co)
    diagnosticos.forEach((codigo, i) => bd.diagnosticos.push({ id_consulta: co.id_consulta, codigo_cie10: codigo, es_principal: i === 0 }))
    if (indicaciones) bd.recetas.push({ id_receta: sig('receta'), id_consulta: co.id_consulta, indicaciones, fecha_emision: c.fecha })
  }

  // Historial de atenciones anteriores
  const pasada = (p, m, dias, hora) => cita(p, m, sumarDias(hoy, -dias), hora, 'atendida')
  let c = pasada(1, 1, 120, '09:00')
  triaje(c, 132, 85, 78, 36.5, 82, 172)
  consulta(c, 'Dolor lumbar de 5 días tras cargar peso.', 'Contractura paravertebral, sin signos de alarma.', ['M54.5'],
    'Naproxeno 550 mg: 1 tableta cada 12 h por 5 días, después de comer.\nCalor local 20 min 3 veces al día.')
  c = pasada(1, 1, 40, '10:20')
  triaje(c, 138, 88, 80, 36.7, 81, 172)
  consulta(c, 'Control de presión arterial.', 'Presión en rango alto. Se ajusta dosis y se refuerza dieta baja en sal.', ['I10'],
    'Losartán 50 mg: 1 tableta cada 24 h por la mañana.\nControl en 1 mes.')
  c = pasada(3, 2, 30, '08:40')
  consulta(c, 'Dolor de garganta y congestión nasal.', 'Faringe congestiva, sin placas.', ['J06.9'],
    'Paracetamol 500 mg: 1 tableta cada 8 h si hay fiebre o dolor, por 3 días.\nAbundantes líquidos.')
  c = pasada(9, 1, 60, '11:00')
  triaje(c, 128, 80, 74, 36.4, 88, 168)
  consulta(c, 'Control de glicemia y colesterol.', 'Glicemia en ayunas 142 mg/dL. LDL elevado.', ['E11.9', 'E78.5'],
    'Metformina 850 mg: 1 tableta con almuerzo y cena.\nAtorvastatina 20 mg: 1 tableta en la noche.')
  c = pasada(5, 3, 15, '09:40')
  triaje(c, 150, 94, 88, 36.6, 76, 165)
  consulta(c, 'Dolor torácico al esfuerzo.', 'Registrado por error en otra cita.', ['R10.4'], null,
    'Se registró en la cita equivocada; se vuelve a registrar.')
  consulta(c, 'Dolor torácico opresivo al subir escaleras.', 'EKG sin cambios agudos. Se solicita prueba de esfuerzo.', ['I20.9', 'I10'],
    'Ácido acetilsalicílico 100 mg: 1 tableta al día.\nEvitar esfuerzos intensos hasta el resultado.')

  // Agenda de hoy (solo si hoy hay horario)
  if (diaSemana(hoy) <= 5) {
    c = cita(1, 1, hoy, '08:00', 'atendida')
    triaje(c, 130, 84, 76, 36.6, 80, 172)
    consulta(c, 'Control de presión arterial.', 'Presión controlada con losartán. Continúa tratamiento.', ['I10'],
      'Losartán 50 mg: 1 tableta cada 24 h por la mañana.\nControl en 3 meses.')
    cita(3, 1, hoy, '08:20', 'inasistente')
    triaje(cita(5, 1, hoy, '08:40', 'triada'), 146, 92, 84, 36.8, 76, 165)
    cita(9, 1, hoy, '09:00', 'confirmada')
    cita(2, 1, hoy, '09:40')
    cita(8, 1, hoy, '10:20')
    cita(6, 1, hoy, '11:00', 'cancelada', 'El paciente pidió cambiar a cardiología.')
    triaje(cita(4, 3, hoy, '08:20', 'triada'), 112, 70, 72, 36.4, 58, 160)
    cita(10, 3, hoy, '09:00', 'confirmada')
    cita(6, 3, hoy, '11:20')
    cita(7, 5, hoy, '09:20', 'confirmada')
    cita(2, 6, hoy, '10:40')
  }

  // Próximos días (para que se vean cupos ocupados)
  const proximos = []
  for (let d = 1; proximos.length < 3; d += 1) if (diaSemana(sumarDias(hoy, d)) <= 5) proximos.push(sumarDias(hoy, d))
  cita(1, 1, proximos[0], '08:00'); cita(4, 1, proximos[0], '08:40'); cita(7, 1, proximos[0], '10:00')
  cita(9, 3, proximos[0], '09:20'); cita(3, 2, proximos[1], '08:20'); cita(10, 1, proximos[1], '11:40')
  cita(8, 6, proximos[2], '09:00')
  return bd
}

// ===== Acceso =====
let bd = null

function cargar() {
  if (bd && bd.fecha_semilla === hoyISO()) return bd
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE))
    if (guardado?.fecha_semilla === hoyISO()) return (bd = guardado)
  } catch { /* sin almacenamiento: se trabaja en memoria */ }
  return (bd = crearSemilla())
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(bd)) } catch { /* solo en memoria */ }
}

export function reiniciarPrototipo() {
  bd = crearSemilla()
  guardar()
}

// Lee la BD simulada; si la función devuelve algo, responde como lo haría la API (con una pequeña demora)
export function leer(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(structuredClone(fn(cargar()))) } catch (e) { reject(e) }
    }, DEMORA_MS)
  })
}

// Igual que leer(), pero guarda los cambios
export function escribir(fn) {
  return leer((datos) => {
    const resultado = fn(datos)
    guardar()
    return resultado
  })
}

// Error con la misma forma que los de axios, para que mensajeError() funcione igual que con la API real
export function errorApi(status, detalle) {
  return Object.assign(new Error(detalle), { response: { status, data: { detalle } } })
}

export const siguienteId = (datos, tabla) => (datos.secuencias[tabla] += 1)

// id_usuario de la sesión actual, leído del token (el backend lo obtiene igual, del JWT)
export function idUsuarioActual() {
  try {
    const carga = localStorage.getItem('sica_access').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return Number(JSON.parse(atob(carga)).sub)
  } catch {
    return 1
  }
}

// Médico con el nombre de su especialidad (como lo devolvería la API con un JOIN)
export function medicoDe(datos, idMedico) {
  const m = datos.medicos.find((x) => x.id_medico === Number(idMedico))
  return m && { ...m, especialidad: datos.especialidades.find((e) => e.id_especialidad === m.id_especialidad)?.nombre }
}

export const usernameDe = (datos, idUsuario) => datos.usuarios.find((u) => u.id_usuario === idUsuario)?.username ?? null

// Guarda una copia del paciente traído de la API real, para poder mostrar su nombre en las citas
export const recordarPaciente = (datos, p) => {
  const { id_paciente, dni, nombres, apellidos, fecha_nacimiento, telefono, numero_hce } = p
  datos.pacientes[id_paciente] = { id_paciente, dni, nombres, apellidos, fecha_nacimiento, telefono, numero_hce }
}
