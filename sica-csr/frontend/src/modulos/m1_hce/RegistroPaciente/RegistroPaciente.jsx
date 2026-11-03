// HU03 · Registrar paciente con DNI único. Pantalla de ejemplo para las demás:
// estado local → llamada a api.js → mostrar resultado o error con mensajeError().
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import { useSesion } from '../../../compartido/autenticacion/ContextoSesion.jsx'
import { pacientesApi } from '../api.js'

const FORMULARIO_VACIO = {
  nombres: '', apellidos: '', fecha_nacimiento: '', telefono: '', email: '', antecedentes: '', alergias: '',
}

export default function RegistroPaciente() {
  const { tieneRol } = useSesion()
  const [dni, setDni] = useState('')
  const [paciente, setPaciente] = useState(null) // paciente encontrado o recién registrado
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'exito' | 'error' | 'info', texto }
  const [ocupado, setOcupado] = useState(false)

  async function buscar(e) {
    e.preventDefault()
    setMensaje(null)
    setPaciente(null)
    setMostrarFormulario(false)
    setOcupado(true)
    try {
      const [encontrado] = (await pacientesApi.buscar(dni)).filter((p) => p.dni === dni)
      if (encontrado) {
        setPaciente(encontrado)
        setMensaje({ tipo: 'info', texto: 'El DNI ya está registrado.' })
      } else {
        setFormulario(FORMULARIO_VACIO)
        setMostrarFormulario(true)
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setOcupado(false)
    }
  }

  async function registrar(e) {
    e.preventDefault()
    setMensaje(null)
    setOcupado(true)
    try {
      // Los campos opcionales vacíos se envían como null
      const datos = Object.fromEntries(Object.entries({ ...formulario, dni }).map(([k, v]) => [k, v || null]))
      const nuevo = await pacientesApi.registrar(datos)
      setPaciente(nuevo)
      setMostrarFormulario(false)
      setMensaje({ tipo: 'exito', texto: `Paciente registrado con ${nuevo.numero_hce}.` })
    } catch (err) {
      const idExistente = err.response?.data?.id_paciente
      if (idExistente) {
        setPaciente(await pacientesApi.obtener(idExistente))
        setMostrarFormulario(false)
      }
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setOcupado(false)
    }
  }

  const cambiar = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value })

  return (
    <section>
      <h1>Registro de pacientes</h1>

      <form className="tarjeta fila" onSubmit={buscar}>
        <label>DNI
          <input value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                 inputMode="numeric" pattern="\d{8}" title="8 dígitos" required autoFocus />
        </label>
        <button className="boton" disabled={ocupado || dni.length !== 8}>Buscar</button>
      </form>

      {mensaje && <p className={`alerta alerta--${mensaje.tipo}`}>{mensaje.texto}</p>}

      {paciente && (
        <article className="tarjeta">
          <h2>{paciente.apellidos}, {paciente.nombres}</h2>
          <dl className="datos">
            <dt>DNI</dt><dd>{paciente.dni}</dd>
            <dt>N.° HCE</dt><dd>{paciente.numero_hce}</dd>
            <dt>Nacimiento</dt><dd>{paciente.fecha_nacimiento}</dd>
            <dt>Teléfono</dt><dd>{paciente.telefono || '—'}</dd>
            <dt>Correo</dt><dd>{paciente.email || '—'}</dd>
          </dl>
          {tieneRol(['medico']) && (
            <Link className="boton boton--secundario" to={`/hce/${paciente.id_paciente}`}>Ver historia clínica</Link>
          )}
        </article>
      )}

      {mostrarFormulario && (
        <form className="tarjeta formulario" onSubmit={registrar}>
          <h2>Nuevo paciente · DNI {dni}</h2>
          <label>Nombres<input name="nombres" value={formulario.nombres} onChange={cambiar} required /></label>
          <label>Apellidos<input name="apellidos" value={formulario.apellidos} onChange={cambiar} required /></label>
          <label>Fecha de nacimiento
            <input name="fecha_nacimiento" type="date" value={formulario.fecha_nacimiento} onChange={cambiar} required />
          </label>
          <label>Teléfono<input name="telefono" value={formulario.telefono} onChange={cambiar} placeholder="+51…" /></label>
          <label>Correo<input name="email" type="email" value={formulario.email} onChange={cambiar} /></label>
          <label className="ancho-completo">Antecedentes
            <textarea name="antecedentes" value={formulario.antecedentes} onChange={cambiar} rows={2} />
          </label>
          <label className="ancho-completo">Alergias
            <textarea name="alergias" value={formulario.alergias} onChange={cambiar} rows={2} />
          </label>
          <div className="ancho-completo">
            <button className="boton" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Registrar y crear HCE'}</button>
          </div>
        </form>
      )}
    </section>
  )
}
