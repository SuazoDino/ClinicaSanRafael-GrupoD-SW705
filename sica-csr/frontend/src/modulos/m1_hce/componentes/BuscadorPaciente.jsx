// Buscador de pacientes por DNI o apellido (API real). Lo usan Agenda, Historia clínica y Pacientes.
// Uso: <BuscadorPaciente paciente={p} onSeleccionar={setP} />  (paciente = null muestra el buscador)
import { useEffect, useState } from 'react'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import Icono from '../../../compartido/componentes/Icono.jsx'
import { edad, nombreCompleto } from '../../../compartido/utilidades/formato.js'
import { pacientesApi } from '../api.js'

export default function BuscadorPaciente({ paciente, onSeleccionar, etiqueta = 'Paciente', autoFocus = false }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [estado, setEstado] = useState('inactivo') // inactivo | buscando | listo | error
  const [error, setError] = useState('')
  const [abierto, setAbierto] = useState(false)

  // Busca 300 ms después de dejar de escribir
  useEffect(() => {
    const t = texto.trim()
    if (t.length < 2) { setResultados([]); setEstado('inactivo'); return undefined }
    setEstado('buscando')
    const temporizador = setTimeout(() => {
      pacientesApi.buscar(t)
        .then((r) => { setResultados(r); setEstado('listo') })
        .catch((e) => { setError(mensajeError(e)); setEstado('error') })
    }, 300)
    return () => clearTimeout(temporizador)
  }, [texto])

  function elegir(p) {
    onSeleccionar(p)
    setTexto('')
    setAbierto(false)
  }

  if (paciente) {
    return (
      <div className="buscador">
        <span className="buscador__etiqueta">{etiqueta}</span>
        <div className="buscador__elegido">
          <span className="avatar-texto">{paciente.nombres.charAt(0)}{paciente.apellidos.charAt(0)}</span>
          <span className="buscador__datos">
            <strong>{nombreCompleto(paciente)}</strong>
            <span className="texto-suave">DNI {paciente.dni} · {paciente.numero_hce} · {edad(paciente.fecha_nacimiento)} años</span>
          </span>
          <button type="button" className="enlace" onClick={() => onSeleccionar(null)}>Cambiar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="buscador">
      <label className="buscador__etiqueta" htmlFor="buscador-paciente">{etiqueta}</label>
      <div className="campo-icono">
        <Icono nombre="buscar" />
        <input id="buscador-paciente" value={texto} autoComplete="off" autoFocus={autoFocus}
          placeholder="DNI, nombre o apellido"
          onChange={(e) => { setTexto(e.target.value); setAbierto(true) }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)} />
      </div>
      {abierto && estado !== 'inactivo' && (
        <ul className="buscador__lista" role="listbox">
          {estado === 'buscando' && <li className="buscador__aviso">Buscando…</li>}
          {estado === 'error' && <li className="buscador__aviso buscador__aviso--error">{error}</li>}
          {estado === 'listo' && resultados.length === 0 && <li className="buscador__aviso">Sin resultados para «{texto}».</li>}
          {estado === 'listo' && resultados.map((p) => (
            <li key={p.id_paciente}>
              <button type="button" className="buscador__opcion" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(p)}>
                <strong>{p.apellidos}, {p.nombres}</strong>
                <span className="texto-suave">DNI {p.dni} · {p.numero_hce}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
