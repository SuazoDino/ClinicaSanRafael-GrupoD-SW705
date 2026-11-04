import { Link } from 'react-router-dom'
import { RUTAS, descripcionPara, tituloPara } from '../../rutas.js'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'
import Icono, { NOMBRE_ROL } from './Icono.jsx'

const saludo = (hora) => (hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches')

export default function Inicio() {
  const { usuario, tieneRol } = useSesion()
  const accesos = RUTAS.filter((r) => r.enMenu !== false && tieneRol(r.roles))

  return (
    <section>
      <div className="bienvenida">
        <h1>{saludo(new Date().getHours())}, {usuario.username}</h1>
        <p className="texto-suave">
          Ingresaste como <strong>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</strong>. Elige un módulo para empezar.
        </p>
      </div>

      <div className="accesos">
        {accesos.map((r) => (
          <Link key={r.ruta} to={r.ruta} className="acceso">
            <span className="acceso__icono"><Icono nombre={r.icono} tamano={22} /></span>
            <span className="acceso__texto">
              <strong>{tituloPara(r, usuario.rol)}</strong>
              {descripcionPara(r, usuario.rol) && <span className="texto-suave">{descripcionPara(r, usuario.rol)}</span>}
            </span>
            <Icono nombre="flecha" className="acceso__flecha" />
          </Link>
        ))}
      </div>
    </section>
  )
}
