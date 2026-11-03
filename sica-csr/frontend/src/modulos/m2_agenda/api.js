// Llamadas a la API del módulo M2 (mismo formato que m1_hce/api.js).
//
// PROTOTIPO: los endpoints de M2 aún no existen, así que cada función responde desde la BD simulada
// (compartido/prototipo/bdPrueba.js) con la forma que tendrá la respuesta real. Al implementar un endpoint,
// se reemplaza solo el cuerpo de la función por la llamada http que figura en su comentario.
import {
  ESPECIALIDADES, errorApi, escribir, leer, medicoDe, recordarPaciente, siguienteId,
} from '../../compartido/prototipo/bdPrueba.js'
import { diaSemana, hoyISO, sumarDias } from '../../compartido/utilidades/formato.js'

const ESTADOS_VIGENTES = (c) => c.estado !== 'cancelada'

// Cita con los datos que la pantalla necesita mostrar (paciente, médico, especialidad, recordatorio y triaje)
function citaSalida(datos, c) {
  return {
    ...c,
    paciente: datos.pacientes[c.id_paciente] ?? null,
    medico: medicoDe(datos, c.id_medico),
    recordatorio: datos.recordatorios.filter((r) => r.id_cita === c.id_cita).at(-1) ?? null,
    triaje: datos.triajes.find((t) => t.id_cita === c.id_cita) ?? null,
  }
}

const ordenarPorHora = (a, b) => a.hora.localeCompare(b.hora) || a.id_medico - b.id_medico

function buscarCita(datos, idCita) {
  const cita = datos.citas.find((c) => c.id_cita === idCita)
  if (!cita) throw errorApi(404, 'Cita no encontrada')
  return cita
}

function cupoOcupado(datos, { id_medico, fecha, hora }, ignorarCita) {
  return datos.citas.some((c) => ESTADOS_VIGENTES(c) && c.id_cita !== ignorarCita
    && c.id_medico === id_medico && c.fecha === fecha && c.hora === hora)
}

// Recordatorio 24 h antes por el canal preferido (HU09)
function programarRecordatorio(datos, cita) {
  datos.recordatorios.push({
    id_recordatorio: siguienteId(datos, 'recordatorio'), id_cita: cita.id_cita, canal: 'whatsapp',
    fecha_programada: `${sumarDias(cita.fecha, -1)}T${cita.hora}`, estado: 'pendiente', respuesta: null,
  })
}

// GET /disponibilidad/especialidades
export const especialidadesApi = {
  listar: () => leer(() => ESPECIALIDADES),
}

// GET /disponibilidad/medicos?id_especialidad=
export const medicosApi = {
  listar: (idEspecialidad) => leer((datos) => datos.medicos
    .filter((m) => !idEspecialidad || m.id_especialidad === Number(idEspecialidad))
    .map((m) => medicoDe(datos, m.id_medico))),
}

// HU01 · GET /disponibilidad?id_medico=&fecha= → cupos calculados desde horario_medico menos las citas vigentes
export const disponibilidadApi = {
  cupos: ({ idMedico, fecha }) => leer((datos) => {
    const horarios = datos.horarios.filter((h) => h.id_medico === Number(idMedico) && h.dia_semana === diaSemana(fecha))
    const ahora = new Date()
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:00`
    return horarios.flatMap((h) => {
      const cupos = []
      const [hi, mi] = h.hora_inicio.split(':').map(Number)
      const [hf, mf] = h.hora_fin.split(':').map(Number)
      for (let min = hi * 60 + mi; min + h.duracion_cupo_min <= hf * 60 + mf; min += h.duracion_cupo_min) {
        const hora = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00`
        const pasado = fecha < hoyISO() || (fecha === hoyISO() && hora <= horaActual)
        const ocupado = cupoOcupado(datos, { id_medico: Number(idMedico), fecha, hora })
        cupos.push({ hora, estado: ocupado ? 'ocupado' : pasado ? 'pasado' : 'libre' })
      }
      return cupos
    })
  }),
  // Días con atención a partir de una fecha (para la tira de días)
  diasConAtencion: (desde, cantidad = 6) => leer((datos) => {
    const dias = []
    for (let d = 0; dias.length < cantidad && d < 30; d += 1) {
      const fecha = sumarDias(desde, d)
      if (datos.horarios.some((h) => h.dia_semana === diaSemana(fecha))) dias.push(fecha)
    }
    return dias
  }),
}

export const citasApi = {
  // GET /citas?fecha=&id_medico=
  listar: ({ fecha, idMedico } = {}) => leer((datos) => datos.citas
    .filter((c) => (!fecha || c.fecha === fecha) && (!idMedico || c.id_medico === Number(idMedico)))
    .sort(ordenarPorHora)
    .map((c) => citaSalida(datos, c))),

  // GET /citas?id_paciente= (próximas citas del paciente)
  delPaciente: (idPaciente) => leer((datos) => datos.citas
    .filter((c) => c.id_paciente === Number(idPaciente) && c.fecha >= hoyISO())
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
    .map((c) => citaSalida(datos, c))),

  // HU02 · POST /citas { id_paciente, id_medico, fecha, hora } → 409 si el cupo ya está tomado (ux_cita_cupo)
  registrar: ({ paciente, id_medico, fecha, hora }) => escribir((datos) => {
    if (cupoOcupado(datos, { id_medico, fecha, hora })) throw errorApi(409, 'Ese cupo acaba de ser tomado. Elige otro horario.')
    recordarPaciente(datos, paciente)
    const cita = { id_cita: siguienteId(datos, 'cita'), id_paciente: paciente.id_paciente, id_medico, fecha, hora, estado: 'registrada', motivo_cancelacion: null }
    datos.citas.push(cita)
    programarRecordatorio(datos, cita)
    return citaSalida(datos, cita)
  }),

  // HU10 · PUT /citas/{id}/reprogramar { fecha, hora } → libera el cupo anterior
  reprogramar: (idCita, { fecha, hora }) => escribir((datos) => {
    const cita = buscarCita(datos, idCita)
    if (!['registrada', 'confirmada'].includes(cita.estado)) throw errorApi(409, 'Solo se reprograman citas que aún no se atienden.')
    if (cupoOcupado(datos, { id_medico: cita.id_medico, fecha, hora }, cita.id_cita)) throw errorApi(409, 'Ese cupo ya está ocupado.')
    Object.assign(cita, { fecha, hora, estado: 'registrada' })
    programarRecordatorio(datos, cita)
    return citaSalida(datos, cita)
  }),

  // HU10 · PUT /citas/{id}/cancelar { motivo } → motivo obligatorio (ck_cita_motivo); la cita no se borra
  cancelar: (idCita, motivo) => escribir((datos) => {
    const cita = buscarCita(datos, idCita)
    if (!motivo?.trim()) throw errorApi(422, 'Indica el motivo de la cancelación.')
    if (!['registrada', 'confirmada'].includes(cita.estado)) throw errorApi(409, 'Esta cita ya no se puede cancelar.')
    Object.assign(cita, { estado: 'cancelada', motivo_cancelacion: motivo.trim().slice(0, 200) })
    return citaSalida(datos, cita)
  }),

  // HU07 · PUT /citas/{id}/asistencia { asistio } → 'confirmada' o 'inasistente'
  marcarAsistencia: (idCita, asistio) => escribir((datos) => {
    const cita = buscarCita(datos, idCita)
    if (cita.estado !== 'registrada') throw errorApi(409, 'La asistencia ya fue registrada.')
    cita.estado = asistio ? 'confirmada' : 'inasistente'
    return citaSalida(datos, cita)
  }),
}

// HU08 · GET /agenda-medico?fecha= (el médico sale del token; el administrador puede indicar id_medico)
export const agendaMedicoApi = {
  delDia: ({ idMedico, fecha = hoyISO() }) => leer((datos) => datos.citas
    .filter((c) => c.id_medico === Number(idMedico) && c.fecha === fecha && ESTADOS_VIGENTES(c))
    .sort(ordenarPorHora)
    .map((c) => citaSalida(datos, c))),
}

// Uso interno de M1 (triaje y consulta cambian el estado de la cita a través de M2, como en el backend)
export function cambiarEstadoCita(datos, idCita, { desde, hacia }) {
  const cita = buscarCita(datos, idCita)
  if (!desde.includes(cita.estado)) throw errorApi(409, `La cita está «${cita.estado}» y no puede pasar a «${hacia}».`)
  cita.estado = hacia
  return cita
}
