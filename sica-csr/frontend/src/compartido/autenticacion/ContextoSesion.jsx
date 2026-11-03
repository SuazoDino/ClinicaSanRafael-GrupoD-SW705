// Guarda quién inició sesión y su rol. En cualquier pantalla: const { usuario, tieneRol } = useSesion()
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { borrarTokens, guardarTokens, hayToken, http } from '../api/clienteHttp.js'

const ContextoSesion = createContext(null)

export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(hayToken())
  const navigate = useNavigate()

  const cargarUsuario = useCallback(async () => {
    const { data } = await http.get('/auth/yo')
    setUsuario(data)
    return data
  }, [])

  useEffect(() => {
    if (!hayToken()) return
    cargarUsuario().catch(() => borrarTokens()).finally(() => setCargando(false))
  }, [cargarUsuario])

  const cerrarSesion = useCallback(() => {
    borrarTokens()
    setUsuario(null)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    window.addEventListener('sesion-expirada', cerrarSesion)
    return () => window.removeEventListener('sesion-expirada', cerrarSesion)
  }, [cerrarSesion])

  async function iniciarSesion(username, password) {
    const formulario = new URLSearchParams({ username, password })
    const { data } = await http.post('/auth/login', formulario)
    guardarTokens(data)
    return cargarUsuario()
  }

  // El administrador tiene acceso a todo
  const tieneRol = (roles) => !roles?.length || usuario?.rol === 'administrador' || roles.includes(usuario?.rol)

  return (
    <ContextoSesion.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, tieneRol }}>
      {children}
    </ContextoSesion.Provider>
  )
}

export const useSesion = () => useContext(ContextoSesion)
