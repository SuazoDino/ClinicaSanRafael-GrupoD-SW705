// HU03 · Registrar paciente con DNI único + RF01 (consultar y actualizar filiación). Usa la API real.
// Pantalla de ejemplo para las demás: estado local → llamada a api.js → mostrar resultado o error con mensajeError().
// Los pacientes no se eliminan (la BD lo impide): solo se registran y se actualizan.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import { useSesion } from '../../../compartido/autenticacion/ContextoSesion.jsx'
import Encabezado from '../../../compartido/componentes/Encabezado.jsx'
import Icono from '../../../compartido/componentes/Icono.jsx'
import Modal from '../../../compartido/componentes/Modal.jsx'
import { edad, hoyISO } from '../../../compartido/utilidades/formato.js'
import { pacientesApi } from '../api.js'

const VACIO = { nombres: '', apellidos: '', fecha_nacimiento: '', telefono: '', email: '', antecedentes: '', alergias: '' }
// Los campos opcionales vacíos se envían como null
const limpiar = (datos) => Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, (typeof v === 'string' ? v.trim() : v) || null]))

export default function RegistroPaciente() {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState(null) // null = aún no se busca
  const [mensaje, setMensaje] = useState(null) // { tipo, texto }
  const [buscando, setBuscando] = useState(false)
  const [nuevo, setNuevo] = useState(false)
  const [editando, setEditando] = useState(null)

  async function buscar(e) {
    e.preventDefault()
    setMensaje(null)
    setBuscando(true)
    try {
      setResultados(await pacientesApi.buscar(texto.trim()))
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setBuscando(false)
    }
  }

  // Al registrar o editar, el paciente queda al inicio de la lista
  function mostrarPaciente(p, textoMensaje) {
    setResultados((lista) => [p, ...(lista ?? []).filter((x) => x.id_paciente !== p.id_paciente)])
    setMensaje({ tipo: 'exito', texto: textoMensaje })
  }

  return (
    <section>
      <Encabezado titulo="Pacientes" descripcion="Busca por DNI o apellido, registra pacientes nuevos y actualiza sus datos.">
        <button className="boton boton--con-icono" onClick={() => setNuevo(true)}>
          <Icono nombre="mas" /><span>Nuevo paciente</span>
        </button>
      </Encabezado>

      <form className="tarjeta barra-busqueda" onSubmit={buscar}>
        <div className="campo-icono">
          <Icono nombre="buscar" />
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="DNI, nombre o apellido"
            aria-label="Buscar paciente" minLength={2} required autoFocus />
        </div>
        <button className="boton" disabled={buscando || texto.trim().length < 2}>{buscando ? 'Buscando…' : 'Buscar'}</button>
      </form>

      {mensaje && <p className={`alerta alerta--${mensaje.tipo}`}>{mensaje.texto}</p>}

      {resultados === null ? (
        <div className="vacio">
          <Icono nombre="pacientes" tamano={28} />
          <p>Escribe al menos 2 caracteres del DNI o del apellido para ver a los pacientes registrados.</p>
        </div>
      ) : (
        <TablaPacientes pacientes={resultados} onEditar={setEditando} />
      )}

      {nuevo && (
        <ModalNuevoPaciente onCerrar={() => setNuevo(false)}
          onRegistrado={(p) => { setNuevo(false); mostrarPaciente(p, `Paciente registrado con ${p.numero_hce}.`) }}
          onExistente={(p) => { setNuevo(false); mostrarPaciente(p, `El DNI ${p.dni} ya estaba registrado (${p.numero_hce}).`) }} />
      )}
      {editando && (
        <ModalEditarPaciente paciente={editando} onCerrar={() => setEditando(null)}
          onGuardado={(p) => { setEditando(null); mostrarPaciente(p, 'Datos del paciente actualizados.') }} />
      )}
    </section>
  )
}

function TablaPacientes({ pacientes, onEditar }) {
  const { tieneRol } = useSesion()
  if (pacientes.length === 0) {
    return <div className="vacio"><p>No se encontraron pacientes. Revisa el DNI o registra uno nuevo.</p></div>
  }
  return (
    <div className="tarjeta tarjeta--tabla">
      <table className="tabla">
        <thead>
          <tr><th>N.° HCE</th><th>Paciente</th><th>DNI</th><th>Edad</th><th>Teléfono</th><th aria-label="Acciones" /></tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id_paciente}>
              <td data-titulo="HCE"><span className="codigo">{p.numero_hce}</span></td>
              <td data-titulo="Paciente"><strong>{p.apellidos}, {p.nombres}</strong></td>
              <td data-titulo="DNI">{p.dni}</td>
              <td data-titulo="Edad">{edad(p.fecha_nacimiento)} años</td>
              <td data-titulo="Teléfono">{p.telefono || '—'}</td>
              <td className="tabla__acciones">
                <button type="button" className="boton-chico" onClick={() => onEditar(p)}>
                  <Icono nombre="editar" tamano={16} /><span>Editar</span>
                </button>
                {tieneRol(['recepcionista']) && (
                  <Link className="boton-chico" to={`/agenda?paciente=${p.id_paciente}`}>
                    <Icono nombre="agenda" tamano={16} /><span>Agendar</span>
                  </Link>
                )}
                {tieneRol(['medico']) && (
                  <Link className="boton-chico" to={`/hce/${p.id_paciente}`}>
                    <Icono nombre="historia" tamano={16} /><span>HCE</span>
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Campos de filiación (iguales a la tabla paciente) para registrar y editar
function CamposPaciente({ datos, onCambiar, conHistoria }) {
  const cambiar = (e) => onCambiar({ ...datos, [e.target.name]: e.target.value })
  return (
    <div className="formulario">
      <label>Nombres<input name="nombres" value={datos.nombres} onChange={cambiar} maxLength={80} required /></label>
      <label>Apellidos<input name="apellidos" value={datos.apellidos} onChange={cambiar} maxLength={80} required /></label>
      <label>Fecha de nacimiento
        <input name="fecha_nacimiento" type="date" value={datos.fecha_nacimiento} onChange={cambiar}
          max={hoyISO()} required />
      </label>
      <label><span>Teléfono <span className="opcional">(opcional)</span></span>
        <input name="telefono" value={datos.telefono ?? ''} onChange={cambiar} maxLength={15} placeholder="+51 9…" inputMode="tel" />
      </label>
      <label className="ancho-completo"><span>Correo <span className="opcional">(opcional)</span></span>
        <input name="email" type="email" value={datos.email ?? ''} onChange={cambiar} maxLength={100} />
      </label>
      {conHistoria && (
        <>
          <label className="ancho-completo"><span>Antecedentes <span className="opcional">(opcional)</span></span>
            <textarea name="antecedentes" value={datos.antecedentes} onChange={cambiar} rows={2} />
          </label>
          <label className="ancho-completo"><span>Alergias <span className="opcional">(opcional)</span></span>
            <textarea name="alergias" value={datos.alergias} onChange={cambiar} rows={2} placeholder="Ej. Penicilina, mariscos" />
          </label>
        </>
      )}
    </div>
  )
}

// Paso 1: DNI (si existe, se avisa y se abre el existente). Paso 2: datos del paciente nuevo.
function ModalNuevoPaciente({ onCerrar, onRegistrado, onExistente }) {
  const [dni, setDni] = useState('')
  const [paso, setPaso] = useState('dni')
  const [datos, setDatos] = useState(VACIO)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function verificarDni(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      const existente = (await pacientesApi.buscar(dni)).find((p) => p.dni === dni)
      if (existente) onExistente(existente)
      else setPaso('datos')
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setOcupado(false)
    }
  }

  async function registrar(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      onRegistrado(await pacientesApi.registrar(limpiar({ ...datos, dni })))
    } catch (err) {
      const idExistente = err.response?.data?.id_paciente
      if (idExistente) onExistente(await pacientesApi.obtener(idExistente))
      else setError(mensajeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const pie = paso === 'dni' ? (
    <>
      <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
      <button className="boton" form="form-paciente" disabled={ocupado || dni.length !== 8}>{ocupado ? 'Verificando…' : 'Continuar'}</button>
    </>
  ) : (
    <>
      <button type="button" className="boton boton--secundario" onClick={() => setPaso('dni')}>Atrás</button>
      <button className="boton" form="form-paciente" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Registrar y crear HCE'}</button>
    </>
  )

  return (
    <Modal titulo="Nuevo paciente" ancho="ancho" onCerrar={onCerrar} pie={pie}
      subtitulo={paso === 'dni' ? 'Primero verificamos que el DNI no esté registrado.' : `DNI ${dni} disponible. Completa los datos del paciente.`}>
      <form id="form-paciente" onSubmit={paso === 'dni' ? verificarDni : registrar}>
        {error && <p className="alerta alerta--error">{error}</p>}
        {paso === 'dni' ? (
          <label>DNI
            <input value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
              inputMode="numeric" pattern="\d{8}" title="8 dígitos" placeholder="8 dígitos" required />
          </label>
        ) : (
          <CamposPaciente datos={datos} onCambiar={setDatos} conHistoria />
        )}
      </form>
    </Modal>
  )
}

function ModalEditarPaciente({ paciente, onCerrar, onGuardado }) {
  const { nombres, apellidos, fecha_nacimiento, telefono, email } = paciente
  const [datos, setDatos] = useState({ nombres, apellidos, fecha_nacimiento, telefono, email })
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      onGuardado(await pacientesApi.actualizar(paciente.id_paciente, limpiar(datos)))
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Modal titulo="Editar paciente" ancho="ancho" onCerrar={onCerrar}
      subtitulo={`${paciente.numero_hce} · DNI ${paciente.dni}`}
      pie={(
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button className="boton" form="form-editar" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar cambios'}</button>
        </>
      )}>
      <form id="form-editar" onSubmit={guardar}>
        {error && <p className="alerta alerta--error">{error}</p>}
        <p className="nota"><Icono nombre="candado" tamano={16} />El DNI y el número de HCE no se modifican: identifican al paciente.</p>
        <CamposPaciente datos={datos} onCambiar={setDatos} />
      </form>
    </Modal>
  )
}
