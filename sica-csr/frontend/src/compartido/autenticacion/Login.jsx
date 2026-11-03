// Login del personal (sistema interno). Estilo de los accesos corporativos: fondo neutro,
// un panel con la marca y el nombre del sistema, y el aviso de uso exclusivo del personal.
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { mensajeError } from '../api/clienteHttp.js'
import { useSesion } from './ContextoSesion.jsx'
import Marca from '../componentes/Marca.jsx'
import { version } from '../../../package.json'
import fotoPortada from '../../assets/login-personal.jpg'

const CLAVE_RECORDAR = 'sica_usuario_recordado'
const leerRecordado = () => { try { return localStorage.getItem(CLAVE_RECORDAR) || '' } catch { return '' } }

// Íconos en línea (trazo simple, heredan el color del texto)
const Icono = ({ d }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const ICONO_USUARIO = <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>
const ICONO_CANDADO = <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>
const ICONO_OJO = <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>
const ICONO_OJO_TACHADO = <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>
const ICONO_ESCUDO = <><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /></>

export default function Login() {
  const { usuario, iniciarSesion } = useSesion()
  const navigate = useNavigate()
  const destino = useLocation().state?.desde || '/'
  const [datos, setDatos] = useState(() => ({ username: leerRecordado(), password: '' }))
  const [recordar, setRecordar] = useState(() => Boolean(leerRecordado()))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verClave, setVerClave] = useState(false)
  const [mayusculas, setMayusculas] = useState(false)
  const [ayuda, setAyuda] = useState(false)

  if (usuario) return <Navigate to={destino} replace />

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await iniciarSesion(datos.username, datos.password)
      try {
        if (recordar) localStorage.setItem(CLAVE_RECORDAR, datos.username)
        else localStorage.removeItem(CLAVE_RECORDAR)
      } catch { /* almacenamiento no disponible */ }
      navigate(destino, { replace: true })
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value })
  const revisarMayusculas = (e) => setMayusculas(e.getModifierState?.('CapsLock') ?? false)

  return (
    <main className="login">
      <aside className="login__portada">
        <img src={fotoPortada} alt="" className="login__foto" />
      </aside>

      <div className="login__contenedor">
        <section className="login__panel">
          <header className="login__encabezado">
            <Marca tamano="mediano" />
          </header>

          <form className="login__formulario" onSubmit={enviar}>
            <div className="login__titulo">
              <h1>Iniciar sesión</h1>
              <p className="texto-suave">SICA-CSR · Sistema de gestión clínica</p>
            </div>

            <div className="login__campo">
              <label htmlFor="login-usuario">Usuario</label>
              <span className="campo-icono">
                <Icono d={ICONO_USUARIO} />
                <input id="login-usuario" name="username" value={datos.username} onChange={cambiar} placeholder="Ej. jperez"
                  autoComplete="username" autoCapitalize="none" spellCheck="false" autoFocus={!datos.username} required />
              </span>
            </div>

            <div className="login__campo">
              <span className="login__fila-etiqueta">
                <label htmlFor="login-clave">Contraseña</label>
                <button type="button" className="enlace" onClick={() => setAyuda(!ayuda)} aria-expanded={ayuda}>
                  ¿Olvidaste tu contraseña?
                </button>
              </span>
              <span className="campo-icono">
                <Icono d={ICONO_CANDADO} />
                <input id="login-clave" name="password" type={verClave ? 'text' : 'password'} value={datos.password}
                  onChange={cambiar} onKeyUp={revisarMayusculas} onKeyDown={revisarMayusculas} placeholder="••••••••"
                  autoComplete="current-password" autoFocus={Boolean(datos.username)} required />
                <button type="button" className="campo-icono__accion" onClick={() => setVerClave(!verClave)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={verClave ? 'Ocultar' : 'Mostrar'}>
                  <Icono d={verClave ? ICONO_OJO_TACHADO : ICONO_OJO} />
                </button>
              </span>
              {mayusculas && <span className="login__aviso">Bloq Mayús está activado</span>}
            </div>

            <label className="login__recordar">
              <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
              Recordar mi usuario en este equipo
            </label>

            {ayuda && (
              <p className="alerta">
                Las contraseñas las restablece el <strong>área de sistemas</strong>. Solicítalo al administrador
                indicando tu usuario.
              </p>
            )}
            {error && <p className="alerta alerta--error">{error}</p>}

            <button className="boton" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
          </form>

          <p className="login__legal">
            <Icono d={ICONO_ESCUDO} />
            <span>Acceso exclusivo para personal autorizado. Los ingresos y las acciones quedan registrados.</span>
          </p>
        </section>

        <footer className="login__pie texto-suave">
          <span>© {new Date().getFullYear()} Clínica San Rafael</span>
          <span>SICA-CSR v{version}</span>
          <span>Soporte: Área de sistemas</span>
        </footer>
      </div>
    </main>
  )
}
