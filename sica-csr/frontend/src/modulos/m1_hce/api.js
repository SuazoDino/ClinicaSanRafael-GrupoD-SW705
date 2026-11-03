// Llamadas a la API del módulo M1. Cada función devuelve directamente los datos.
//
// pacientesApi ya usa la API real. Las demás son PROTOTIPO: responden desde la BD simulada
// (compartido/prototipo/bdPrueba.js) con la forma que tendrá la respuesta real; al implementar el endpoint
// se reemplaza solo el cuerpo de la función por la llamada http indicada en su comentario.
import { http } from '../../compartido/api/clienteHttp.js'
import {
  CIE10, errorApi, escribir, idUsuarioActual, leer, medicoDe, recordarPaciente, siguienteId, usernameDe,
} from '../../compartido/prototipo/bdPrueba.js'
import { ahoraISO, hoyISO } from '../../compartido/utilidades/formato.js'
import { cambiarEstadoCita } from '../m2_agenda/api.js'

export const pacientesApi = {
  buscar: (texto) => http.get('/pacientes', { params: { texto } }).then((r) => r.data),
  obtener: (id) => http.get(`/pacientes/${id}`).then((r) => r.data),
  registrar: (datos) => http.post('/pacientes', datos).then((r) => r.data),
  actualizar: (id, datos) => http.put(`/pacientes/${id}`, datos).then((r) => r.data),
}

// HU04 · GET /historias/{id_paciente} → vista unificada (paciente + antecedentes + triaje + consultas)
export const historiasApi = {
  obtener: async (idPaciente) => {
    const paciente = await pacientesApi.obtener(idPaciente) // dato real
    return leer((datos) => {
      const citasPaciente = datos.citas.filter((c) => c.id_paciente === paciente.id_paciente)
      const idsCitas = new Set(citasPaciente.map((c) => c.id_cita))
      const triajes = datos.triajes.filter((t) => idsCitas.has(t.id_cita)).sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro))
      const consultas = datos.consultas
        .filter((co) => idsCitas.has(co.id_cita))
        .sort((a, b) => b.fecha_consulta.localeCompare(a.fecha_consulta))
        .map((co) => ({
          ...co,
          medico: medicoDe(datos, citasPaciente.find((c) => c.id_cita === co.id_cita).id_medico),
          anulada_por_usuario: co.anulada_por ? usernameDe(datos, co.anulada_por) : null,
          diagnosticos: datos.diagnosticos
            .filter((d) => d.id_consulta === co.id_consulta)
            .sort((a, b) => b.es_principal - a.es_principal)
            .map((d) => ({ ...d, descripcion: CIE10.find((x) => x.codigo === d.codigo_cie10)?.descripcion })),
          receta: datos.recetas.find((r) => r.id_consulta === co.id_consulta) ?? null,
        }))
      // Citas de hoy que el médico puede atender (ya pasaron por recepción o triaje)
      const citasPorAtender = citasPaciente
        .filter((c) => c.fecha === hoyISO() && ['confirmada', 'triada'].includes(c.estado))
        .map((c) => ({ ...c, medico: medicoDe(datos, c.id_medico) }))
      return {
        paciente,
        antecedentes: datos.historias[paciente.id_paciente]?.antecedentes ?? null,
        alergias: datos.historias[paciente.id_paciente]?.alergias ?? null,
        triaje_reciente: triajes[0] ?? null,
        consultas,
        citas_por_atender: citasPorAtender,
      }
    })
  },
}

// GET /cie10?texto=
export const cie10Api = {
  buscar: (texto) => leer(() => {
    const t = texto.trim().toLowerCase()
    return CIE10.filter((c) => c.codigo.toLowerCase().startsWith(t) || c.descripcion.toLowerCase().includes(t)).slice(0, 8)
  }),
}

// Rangos válidos de signos vitales (mismos CHECK que la tabla triaje)
export const RANGOS_TRIAJE = {
  presion_sistolica: [50, 300], presion_diastolica: [30, 200], frecuencia_cardiaca: [20, 250],
  temperatura: [30, 45], peso_kg: [0.5, 400], talla_cm: [30, 250],
}
const NOMBRE_SIGNO = {
  presion_sistolica: 'la presión sistólica', presion_diastolica: 'la presión diastólica', frecuencia_cardiaca: 'la frecuencia cardiaca',
  temperatura: 'la temperatura', peso_kg: 'el peso', talla_cm: 'la talla',
}

export const triajeApi = {
  // GET /triajes/pendientes?fecha= → citas del día que ya llegaron (confirmada) o ya tienen triaje (triada)
  delDia: (fecha = hoyISO()) => leer((datos) => datos.citas
    .filter((c) => c.fecha === fecha && ['confirmada', 'triada'].includes(c.estado))
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .map((c) => ({
      ...c,
      paciente: datos.pacientes[c.id_paciente],
      medico: medicoDe(datos, c.id_medico),
      triaje: datos.triajes.find((t) => t.id_cita === c.id_cita) ?? null,
    }))),

  // HU11 · POST /triajes → la cita pasa de «confirmada» a «triada»
  registrar: (signos) => escribir((datos) => {
    for (const [campo, [min, max]] of Object.entries(RANGOS_TRIAJE)) {
      const v = Number(signos[campo])
      if (!Number.isFinite(v) || v < min || v > max) throw errorApi(422, `Revisa ${NOMBRE_SIGNO[campo]}: debe estar entre ${min} y ${max}.`)
    }
    if (datos.triajes.some((t) => t.id_cita === signos.id_cita)) throw errorApi(409, 'Esta cita ya tiene triaje.')
    cambiarEstadoCita(datos, signos.id_cita, { desde: ['confirmada'], hacia: 'triada' })
    const triaje = {
      id_triaje: siguienteId(datos, 'triaje'), registrado_por: idUsuarioActual(), fecha_registro: ahoraISO(),
      ...Object.fromEntries(Object.keys(RANGOS_TRIAJE).map((k) => [k, Number(signos[k])])), id_cita: signos.id_cita,
    }
    datos.triajes.push(triaje)
    return triaje
  }),
}

export const consultasApi = {
  // HU05 · POST /consultas { id_cita, motivo, evolucion, diagnosticos: [{codigo_cie10, es_principal}], receta }
  registrar: ({ paciente, id_cita, motivo, evolucion, diagnosticos, indicaciones }) => escribir((datos) => {
    if (!motivo?.trim()) throw errorApi(422, 'Indica el motivo de la consulta.')
    if (!diagnosticos?.length) throw errorApi(422, 'Agrega al menos un diagnóstico CIE-10.')
    if (diagnosticos.filter((d) => d.es_principal).length !== 1) throw errorApi(422, 'Marca un solo diagnóstico como principal.')
    cambiarEstadoCita(datos, id_cita, { desde: ['confirmada', 'triada'], hacia: 'atendida' })
    recordarPaciente(datos, paciente)
    const consulta = {
      id_consulta: siguienteId(datos, 'consulta'), id_cita, id_historia: paciente.id_historia,
      fecha_consulta: ahoraISO(), motivo: motivo.trim().slice(0, 300), evolucion: evolucion?.trim() || null,
      anulada: false, motivo_anulacion: null, anulada_por: null, fecha_anulacion: null,
    }
    datos.consultas.push(consulta)
    diagnosticos.forEach((d) => datos.diagnosticos.push({ id_consulta: consulta.id_consulta, codigo_cie10: d.codigo_cie10, es_principal: d.es_principal }))
    if (indicaciones?.trim()) {
      datos.recetas.push({ id_receta: siguienteId(datos, 'receta'), id_consulta: consulta.id_consulta, indicaciones: indicaciones.trim(), fecha_emision: hoyISO() })
    }
    return consulta
  }),

  // HU12 · PUT /consultas/{id}/anular { motivo } → no se borra: queda marcada con quién, cuándo y por qué
  anular: (idConsulta, motivo) => escribir((datos) => {
    const consulta = datos.consultas.find((c) => c.id_consulta === idConsulta)
    if (!consulta) throw errorApi(404, 'Consulta no encontrada')
    if (consulta.anulada) throw errorApi(409, 'La entrada ya estaba anulada.')
    if (!motivo?.trim()) throw errorApi(422, 'Indica el motivo de la anulación.')
    Object.assign(consulta, {
      anulada: true, motivo_anulacion: motivo.trim().slice(0, 300), anulada_por: idUsuarioActual(),
      fecha_anulacion: ahoraISO(),
    })
    return consulta
  }),
}
