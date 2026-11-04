// El menú se arma solo a partir de src/rutas.js y muestra únicamente lo que el rol puede ver.
import { NavLink } from 'react-router-dom'
import { version } from '../../../package.json'
import { RUTAS, tituloPara } from '../../rutas.js'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'
import Icono from '../componentes/Icono.jsx'
import Marca from '../componentes/Marca.jsx'

export default function MenuLateral({ abierto = false, onCerrar }) {
  const { tieneRol, usuario } = useSesion()
  const visibles = RUTAS.filter((r) => r.enMenu !== false && tieneRol(r.roles))
  // Agrupa los enlaces por sección («Módulos», «Administración»…) en el orden en que aparecen
  const secciones = [...new Set(visibles.map((r) => r.seccion ?? 'Módulos'))]

  return (
    <nav className={`menu${abierto ? ' menu--abierto' : ''}`} aria-label="Menú principal">
      <div className="menu__cabeza">
        <NavLink to="/" end className="menu__marca"><Marca variante="clara" /></NavLink>
        <button type="button" className="menu__cerrar" onClick={onCerrar} aria-label="Cerrar menú">
          <Icono nombre="cerrar" tamano={22} />
        </button>
      </div>

      <NavLink to="/" end className="menu__enlace">
        <Icono nombre="inicio" /><span>Inicio</span>
      </NavLink>

      {secciones.map((seccion) => (
        <div key={seccion} className="menu__grupo">
          <p className="menu__seccion">{seccion}</p>
          {visibles.filter((r) => (r.seccion ?? 'Módulos') === seccion).map((r) => (
            <NavLink key={r.ruta} to={r.ruta} className="menu__enlace">
              <Icono nombre={r.icono} /><span>{tituloPara(r, usuario.rol)}</span>
            </NavLink>
          ))}
        </div>
      ))}

      <p className="menu__pie">SICA-CSR v{version}</p>
    </nav>
  )
}
