// Llamadas a la API del módulo M2 (mismo formato que m1_hce/api.js). Cada función devuelve directamente los datos.
// Forma de cada respuesta: CONTRATO_API_SPRINT1.md (CitaSalida trae paciente, médico, último recordatorio y triaje).
import { http } from '../../compartido/api/clienteHttp.js'
import { hoyISO } from '../../compartido/utilidades/formato.js'

const aDatos = (r) => r.data

// Quita filtros vacíos para no mandar ?id_medico= sin valor
const params = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const especialidadesApi = {
  listar: () => http.get('/disponibilidad/especialidades').then(aDatos),
}

export const medicosApi = {
  listar: (idEspecialidad) => http.get('/disponibilidad/medicos', { params: params({ id_especialidad: idEspecialidad }) }).then(aDatos),
}

// HU01 · cupos calculados desde horario_medico menos las citas vigentes
export const disponibilidadApi = {
  cupos: ({ idMedico, fecha }) => http.get('/disponibilidad', { params: { id_medico: idMedico, fecha } }).then(aDatos),
  // Días con atención a partir de una fecha (para la tira de días)
  diasConAtencion: (desde, cantidad = 6) => http.get('/disponibilidad/dias', { params: { desde, cantidad } }).then(aDatos),
}

export const citasApi = {
  listar: ({ fecha, idMedico } = {}) => http.get('/citas', { params: params({ fecha, id_medico: idMedico }) }).then(aDatos),

  // Próximas citas del paciente
  delPaciente: (idPaciente) => http.get('/citas', { params: { id_paciente: idPaciente } }).then(aDatos),

  // HU02 · 409 si el cupo ya está tomado (ux_cita_cupo)
  registrar: ({ paciente, id_medico, fecha, hora }) =>
    http.post('/citas', { id_paciente: paciente.id_paciente, id_medico, fecha, hora }).then(aDatos),

  // HU10 · libera el cupo anterior y programa un recordatorio nuevo
  reprogramar: (idCita, { fecha, hora }) => http.put(`/citas/${idCita}/reprogramar`, { fecha, hora }).then(aDatos),

  // HU10 · motivo obligatorio; la cita no se borra
  cancelar: (idCita, motivo) => http.put(`/citas/${idCita}/cancelar`, { motivo }).then(aDatos),

  // HU07 · 'confirmada' o 'inasistente'
  marcarAsistencia: (idCita, asistio) => http.put(`/citas/${idCita}/asistencia`, { asistio }).then(aDatos),
}

// HU08 · el médico ve la suya (el backend la toma de su usuario); recepción indica id_medico (ERS 3.5)
export const agendaMedicoApi = {
  delDia: ({ idMedico, fecha = hoyISO() }) => http.get('/agenda-medico', { params: params({ id_medico: idMedico, fecha }) }).then(aDatos),
}
