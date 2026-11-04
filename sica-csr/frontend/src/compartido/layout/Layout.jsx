import { useEffect, useState } from 'react'
import { Outlet, matchPath, useLocation } from 'react-router-dom'
import { RUTAS, tituloPara } from '../../rutas.js'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'
import Icono, { NOMBRE_ROL } from '../componentes/Icono.jsx'
import MenuLateral from './MenuLateral.jsx'

const fmtFecha = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)

// Título de la pantalla actual, tomado de rutas.js
function usePantallaActual() {
  const { pathname } = useLocation()
  if (pathname === '/') return { titulo: 'Inicio', icono: 'inicio' }
  return RUTAS.find((r) => matchPath(r.ruta, pathname)) ?? { titulo: '', icono: 'inicio' }
}

export default function Layout() {
  const { usuario, cerrarSesion } = useSesion()
  const pantalla = usePantallaActual()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // En tablet/celular el menú es un panel deslizable: se cierra al cambiar de pantalla o con Esc
  useEffect(() => setMenuAbierto(false), [pathname])
  useEffect(() => {
    if (!menuAbierto) return
    const alPresionar = (e) => e.key === 'Escape' && setMenuAbierto(false)
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [menuAbierto])

  return (
    <div className="layout">
      <MenuLateral abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      {menuAbierto && <div className="layout__velo" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}
      <div className="layout__principal">
        <header className="cabecera">
          <div className="cabecera__pantalla">
            <button type="button" className="cabecera__menu" onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú" aria-expanded={menuAbierto}>
              <Icono nombre="menu" tamano={22} />
            </button>
            <span className="cabecera__icono"><Icono nombre={pantalla.icono} /></span>
            <div className="cabecera__textos">
              <strong className="cabecera__titulo">{tituloPara(pantalla, usuario.rol)}</strong>
              <span className="cabecera__fecha">{capitalizar(fmtFecha.format(new Date()))}</span>
            </div>
          </div>

          <div className="cabecera__acciones">
            <div className="usuario" title={`Sesión iniciada como ${usuario.username}`}>
              <span className="usuario__avatar">{usuario.username.charAt(0).toUpperCase()}</span>
              <span className="usuario__datos">
                <strong>{usuario.username}</strong>
                <span className="usuario__rol">{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</span>
              </span>
            </div>
            <span className="cabecera__separador" aria-hidden="true" />
            <button className="boton boton--salir" onClick={cerrarSesion} title="Cerrar sesión" aria-label="Cerrar sesión">
              <Icono nombre="salir" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>
        <main className="layout__contenido">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
