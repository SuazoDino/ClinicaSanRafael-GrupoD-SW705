import { Link } from 'react-router-dom'
import { RUTAS } from '../../rutas.js'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'
import isotipo from '../../assets/isotipo-clinica-san-rafael.png'

export default function Inicio() {
  const { usuario, tieneRol } = useSesion()
  const accesos = RUTAS.filter((r) => r.enMenu !== false && tieneRol(r.roles))
  return (
    <section>
      <div className="bienvenida">
        <div>
          <p className="bienvenida__clinica">Clínica San Rafael</p>
          <h1>Bienvenido, {usuario.username}</h1>
          <p className="texto-suave">Elige un módulo para empezar.</p>
        </div>
        <img src={isotipo} alt="" className="bienvenida__logo" />
      </div>
      <div className="accesos">
        {accesos.map((r) => <Link key={r.ruta} to={r.ruta} className="tarjeta acceso">{r.titulo}</Link>)}
      </div>
    </section>
  )
}
