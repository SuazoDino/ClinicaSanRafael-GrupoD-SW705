// El menú se arma solo a partir de src/rutas.js y muestra únicamente lo que el rol puede ver.
import { NavLink } from 'react-router-dom'
import { RUTAS } from '../../rutas.js'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'

export default function MenuLateral() {
  const { tieneRol } = useSesion()
  const visibles = RUTAS.filter((r) => r.enMenu !== false && tieneRol(r.roles))

  return (
    <nav className="menu">
      <NavLink to="/" className="menu__marca">SICA-CSR</NavLink>
      {visibles.map((r) => (
        <NavLink key={r.ruta} to={r.ruta} className="menu__enlace">{r.titulo}</NavLink>
      ))}
    </nav>
  )
}
