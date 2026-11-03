// Cliente HTTP único para toda la app. Ya incluye el token en cada petición y renueva
// la sesión cuando vence. En los módulos solo se usa: http.get('/pacientes', { params })
import axios from 'axios'

const CLAVE_ACCESO = 'sica_access'
const CLAVE_REFRESCO = 'sica_refresh'

function leer(clave) {
  try { return localStorage.getItem(clave) } catch { return null }
}

export function guardarTokens({ access_token, refresh_token }) {
  try {
    localStorage.setItem(CLAVE_ACCESO, access_token)
    localStorage.setItem(CLAVE_REFRESCO, refresh_token)
  } catch { /* almacenamiento no disponible: la sesión dura lo que la pestaña */ }
}

export function borrarTokens() {
  try {
    localStorage.removeItem(CLAVE_ACCESO)
    localStorage.removeItem(CLAVE_REFRESCO)
  } catch { /* nada que borrar */ }
}

export const hayToken = () => Boolean(leer(CLAVE_ACCESO))

export const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use((config) => {
  const token = leer(CLAVE_ACCESO)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refrescoEnCurso = null

http.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const original = error.config
    const esAuth = original?.url?.startsWith('/auth/')
    if (error.response?.status !== 401 || esAuth || original._reintento) throw error

    original._reintento = true
    try {
      refrescoEnCurso ??= axios
        .post('/api/auth/refrescar', { refresh_token: leer(CLAVE_REFRESCO) })
        .then(({ data }) => guardarTokens(data))
        .finally(() => { refrescoEnCurso = null })
      await refrescoEnCurso
      return http(original)
    } catch {
      borrarTokens()
      window.dispatchEvent(new Event('sesion-expirada'))
      throw error
    }
  },
)

// Convierte cualquier error de la API en un texto para mostrar al usuario
export function mensajeError(error) {
  const datos = error?.response?.data
  if (datos?.detalle) return datos.detalle
  if (Array.isArray(datos?.detail)) return datos.detail.map((e) => e.msg).join('. ')
  if (typeof datos?.detail === 'string') return datos.detail
  return 'No se pudo conectar con el servidor'
}
