import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { mensajeError } from '../api/clienteHttp.js'
import { useSesion } from './ContextoSesion.jsx'

export default function Login() {
  const { usuario, iniciarSesion } = useSesion()
  const navigate = useNavigate()
  const destino = useLocation().state?.desde || '/'
  const [datos, setDatos] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={destino} replace />

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await iniciarSesion(datos.username, datos.password)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value })

  return (
    <main className="login">
      <form className="tarjeta login__tarjeta" onSubmit={enviar}>
        <h1>SICA-CSR</h1>
        <p className="texto-suave">Clínica San Rafael</p>
        <label>Usuario<input name="username" value={datos.username} onChange={cambiar} autoFocus required /></label>
        <label>Contraseña<input name="password" type="password" value={datos.password} onChange={cambiar} required /></label>
        {error && <p className="alerta alerta--error">{error}</p>}
        <button className="boton" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </main>
  )
}
