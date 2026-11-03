// Llamadas a la API del módulo M1. Cada función devuelve directamente los datos.
import { http } from '../../compartido/api/clienteHttp.js'

export const pacientesApi = {
  buscar: (texto) => http.get('/pacientes', { params: { texto } }).then((r) => r.data),
  obtener: (id) => http.get(`/pacientes/${id}`).then((r) => r.data),
  registrar: (datos) => http.post('/pacientes', datos).then((r) => r.data),
  actualizar: (id, datos) => http.put(`/pacientes/${id}`, datos).then((r) => r.data),
}

// Pendientes: historiasApi (HU04), consultasApi (HU05, HU06, HU12), cie10Api (HU05), triajeApi (HU11)
