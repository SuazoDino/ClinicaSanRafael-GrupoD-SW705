import { Outlet } from 'react-router-dom'
import { useSesion } from '../autenticacion/ContextoSesion.jsx'
import MenuLateral from './MenuLateral.jsx'

export default function Layout() {
  const { usuario, cerrarSesion } = useSesion()
  return (
    <div className="layout">
      <MenuLateral />
      <div className="layout__principal">
        <header className="layout__cabecera">
          <span>{usuario.username} · <span className="texto-suave">{usuario.rol}</span></span>
          <button className="boton boton--secundario" onClick={cerrarSesion}>Cerrar sesión</button>
        </header>
        <main className="layout__contenido">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
