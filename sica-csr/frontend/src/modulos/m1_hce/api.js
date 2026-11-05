// Llamadas a la API del módulo M1. Cada función devuelve directamente los datos.
// Forma de cada respuesta: CONTRATO_API_SPRINT1.md.
import { http } from '../../compartido/api/clienteHttp.js'
import { hoyISO } from '../../compartido/utilidades/formato.js'

const aDatos = (r) => r.data

export const pacientesApi = {
  buscar: (texto) => http.get('/pacientes', { params: { texto } }).then(aDatos),
  obtener: (id) => http.get(`/pacientes/${id}`).then(aDatos),
  registrar: (datos) => http.post('/pacientes', datos).then(aDatos),
  actualizar: (id, datos) => http.put(`/pacientes/${id}`, datos).then(aDatos),
}

// HU04 · vista unificada (paciente + antecedentes + triaje + consultas + citas por atender)
export const historiasApi = {
  obtener: (idPaciente) => http.get(`/historias/${idPaciente}`).then(aDatos),
}

export const cie10Api = {
  buscar: (texto) => http.get('/cie10', { params: { texto: texto.trim() } }).then(aDatos),
}

// Rangos válidos de signos vitales (mismos CHECK que la tabla triaje y que el backend)
export const RANGOS_TRIAJE = {
  presion_sistolica: [50, 300], presion_diastolica: [30, 200], frecuencia_cardiaca: [20, 250],
  temperatura: [30, 45], peso_kg: [0.5, 400], talla_cm: [30, 250],
}
const NOMBRE_SIGNO = {
  presion_sistolica: 'la presión sistólica', presion_diastolica: 'la presión diastólica', frecuencia_cardiaca: 'la frecuencia cardiaca',
  temperatura: 'la temperatura', peso_kg: 'el peso', talla_cm: 'la talla',
}

// Error con la forma de los de axios, para que mensajeError() lo muestre igual que uno del backend
const errorLocal = (detalle) => Object.assign(new Error(detalle), { response: { status: 422, data: { detalle } } })

export const triajeApi = {
  // Citas del día que ya llegaron (confirmada) o ya tienen triaje (triada)
  delDia: (fecha = hoyISO()) => http.get('/triajes/pendientes', { params: { fecha } }).then(aDatos),

  // HU11 · la cita pasa de «confirmada» a «triada». Se revisa antes de enviar para dar el mismo mensaje
  // también cuando un campo está vacío (el backend responde 422 con los mismos rangos).
  registrar: (signos) => {
    for (const [campo, [min, max]] of Object.entries(RANGOS_TRIAJE)) {
      const v = Number(signos[campo])
      if (signos[campo] === '' || !Number.isFinite(v) || v < min || v > max) {
        return Promise.reject(errorLocal(`Revisa ${NOMBRE_SIGNO[campo]}: debe estar entre ${min} y ${max}.`))
      }
    }
    const cuerpo = { id_cita: signos.id_cita, ...Object.fromEntries(Object.keys(RANGOS_TRIAJE).map((k) => [k, Number(signos[k])])) }
    return http.post('/triajes', cuerpo).then(aDatos)
  },
}

export const consultasApi = {
  // HU05 · la cita pasa a «atendida»; si hay indicaciones se emite la receta. `paciente` no se envía:
  // el backend obtiene la historia a partir de la cita.
  registrar: ({ id_cita, motivo, evolucion, diagnosticos, indicaciones }) => http.post('/consultas', {
    id_cita,
    motivo,
    evolucion: evolucion || null,
    diagnosticos: diagnosticos.map(({ codigo_cie10, es_principal }) => ({ codigo_cie10, es_principal })),
    indicaciones: indicaciones || null,
  }).then(aDatos),

  // HU12 · no se borra: queda marcada con quién, cuándo y por qué
  anular: (idConsulta, motivo) => http.put(`/consultas/${idConsulta}/anular`, { motivo }).then(aDatos),
}
