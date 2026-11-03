import { Link } from 'react-router-dom'
import { RUTAS } from '../../rutas.js'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'

export default function Inicio() {
  const { usuario, tieneRol } = useSesion()
  const accesos = RUTAS.filter((r) => r.enMenu !== false && tieneRol(r.roles))
  return (
    <section>
      <h1>Bienvenido, {usuario.username}</h1>
      <div className="accesos">
        {accesos.map((r) => <Link key={r.ruta} to={r.ruta} className="tarjeta acceso">{r.titulo}</Link>)}
      </div>
    </section>
  )
}
