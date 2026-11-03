// El menú se arma solo a partir de src/rutas.js y muestra únicamente lo que el rol puede ver.
import { NavLink } from 'react-router-dom'
import { RUTAS } from '../../rutas.js'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'
import Marca from '../componentes/Marca.jsx'

export default function MenuLateral() {
  const { tieneRol } = useSesion()
  const visibles = RUTAS.filter((r) => r.enMenu !== false && tieneRol(r.roles))

  return (
    <nav className="menu">
      <NavLink to="/" end className="menu__marca"><Marca variante="clara" /></NavLink>
      {visibles.map((r) => (
        <NavLink key={r.ruta} to={r.ruta} className="menu__enlace">{r.titulo}</NavLink>
      ))}
    </nav>
  )
}
