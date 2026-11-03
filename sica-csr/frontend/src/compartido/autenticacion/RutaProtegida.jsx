// Envuelve una pantalla: exige sesión iniciada y, si se indican roles, que el usuario tenga uno de ellos.
import { Navigate, useLocation } from 'react-router-dom'
import { useSesion } from './ContextoSesion.jsx'

export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando, tieneRol } = useSesion()
  const location = useLocation()

  if (cargando) return <p className="cargando">Cargando…</p>
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (!tieneRol(roles)) return <p className="alerta alerta--error">No tiene permiso para ver esta pantalla.</p>
  return children
}
