// Administración del personal y usuarios: médicos (datos, horario y acceso), enfermería y recepción (acceso)
// y el catálogo de especialidades.
// PENDIENTE DE DECISIÓN (no está en Sprint 1 ni 2). PROTOTIPO sobre la BD simulada (ver ../api.js).
// Nada se borra: a quien deja la clínica se le desactiva el acceso (usuario.activo).
import { useEffect, useState } from 'react'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import Encabezado from '../../../compartido/componentes/Encabezado.jsx'
import Icono from '../../../compartido/componentes/Icono.jsx'
import Modal from '../../../compartido/componentes/Modal.jsx'
import { horaCorta, nombreCompleto } from '../../../compartido/utilidades/formato.js'
import { especialidadesApi, medicosAdminApi, usuariosAdminApi } from '../api.js'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DURACIONES = [10, 15, 20, 30, 40, 60]

// "Lun–Vie · 08:00–13:00" agrupando días seguidos con los mismos turnos
function resumenHorario(horarios) {
  if (!horarios.length) return []
  const porDia = DIAS.map((_, i) => horarios.filter((h) => h.dia_semana === i + 1)
    .map((h) => `${horaCorta(h.hora_inicio)}–${horaCorta(h.hora_fin)}`).join(', '))
  const grupos = []
  porDia.forEach((texto, i) => {
    const ultimo = grupos.at(-1)
    if (texto && ultimo?.texto === texto && ultimo.hasta === i - 1) ultimo.hasta = i
    else if (texto) grupos.push({ desde: i, hasta: i, texto })
  })
  return grupos.map((g) => `${DIAS[g.desde]}${g.hasta > g.desde ? `–${DIAS[g.hasta]}` : ''} · ${g.texto}`)
}

const cuposDe = (t) => {
  const [hi, mi] = t.hora_inicio.split(':').map(Number)
  const [hf, mf] = t.hora_fin.split(':').map(Number)
  const total = Math.floor((hf * 60 + mf - (hi * 60 + mi)) / Number(t.duracion_cupo_min))
  return total > 0 ? total : 0
}

const sugerirUsuario = (nombres, apellidos) => {
  const limpio = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
  return `${limpio(nombres).charAt(0)}${limpio(apellidos.split(' ')[0] ?? '')}`
}

// Pestañas de la pantalla. Los roles de usuario son los de la tabla rol.
const PESTANAS = [
  { id: 'medicos', titulo: 'Médicos', nuevo: 'Nuevo médico' },
  { id: 'enfermera', titulo: 'Enfermería', nuevo: 'Nueva enfermera', rol: 'enfermera' },
  { id: 'recepcionista', titulo: 'Recepción', nuevo: 'Nuevo recepcionista', rol: 'recepcionista' },
  { id: 'especialidades', titulo: 'Especialidades', nuevo: 'Nueva especialidad' },
]
const NOMBRE_ROL = { enfermera: 'Enfermera', recepcionista: 'Recepcionista', medico: 'Médico' }

export default function Personal() {
  const [pestana, setPestana] = useState('medicos')
  const [medicos, setMedicos] = useState(null)
  const [usuarios, setUsuarios] = useState(null)
  const [especialidades, setEspecialidades] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [modal, setModal] = useState(null) // { tipo, dato }
  const [version, setVersion] = useState(0)

  useEffect(() => {
    medicosAdminApi.listar().then(setMedicos)
    usuariosAdminApi.listar().then(setUsuarios)
    especialidadesApi.listar().then(setEspecialidades)
  }, [version])

  const actual = PESTANAS.find((p) => p.id === pestana)
  const cuenta = (p) => (p.id === 'medicos' ? medicos?.length : p.id === 'especialidades' ? especialidades?.length
    : usuarios?.filter((u) => u.rol === p.rol).length)
  const recargar = () => setVersion((v) => v + 1)
  const cerrar = () => setModal(null)
  const listo = (texto, extra) => { setModal(extra ?? null); setMensaje({ tipo: 'exito', texto }); recargar() }

  function nuevo() {
    if (pestana === 'medicos') setModal({ tipo: 'medico' })
    else if (pestana === 'especialidades') setModal({ tipo: 'especialidad' })
    else setModal({ tipo: 'usuario', rol: actual.rol })
  }

  async function cambiarActivo(usuario) {
    try {
      await usuariosAdminApi.cambiarActivo(usuario.id_usuario, !usuario.activo)
      setMensaje({ tipo: 'exito', texto: `Acceso de «${usuario.username}» ${usuario.activo ? 'desactivado' : 'activado'}.` })
      recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    }
  }

  return (
    <section>
      <Encabezado titulo="Personal y usuarios" descripcion="Médicos, enfermería y recepción: datos, horarios, accesos y especialidades.">
        <button className="boton boton--con-icono" onClick={nuevo}><Icono nombre="mas" /><span>{actual.nuevo}</span></button>
      </Encabezado>

      <div className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button key={p.id} role="tab" aria-selected={pestana === p.id} className={`pestana${pestana === p.id ? ' pestana--activa' : ''}`}
            onClick={() => { setPestana(p.id); setMensaje(null) }}>
            {p.titulo} <span className="pestana__cuenta">{cuenta(p) ?? '…'}</span>
          </button>
        ))}
      </div>

      {mensaje && <p className={`alerta alerta--${mensaje.tipo}`}>{mensaje.texto}</p>}

      {pestana === 'medicos' && (
        <div className="tarjeta tarjeta--tabla">
          {medicos === null ? <p className="cargando">Cargando…</p> : (
            <table className="tabla">
              <thead><tr><th>Médico</th><th>Especialidad</th><th>Horario de atención</th><th>Acceso</th><th aria-label="Acciones" /></tr></thead>
              <tbody>
                {medicos.map((m) => {
                  const resumen = resumenHorario(m.horarios)
                  return (
                    <tr key={m.id_medico}>
                      <td data-titulo="Médico"><strong>{nombreCompleto(m)}</strong><span className="tabla__sub">{m.colegiatura}</span></td>
                      <td data-titulo="Especialidad">{m.especialidad}</td>
                      <td data-titulo="Horario">
                        {resumen.length ? resumen.map((r) => <span key={r} className="horario-linea">{r}</span>)
                          : <span className="aviso-clinico"><Icono nombre="alerta" tamano={14} />Sin horario: no aparece en la agenda</span>}
                        {m.horarios[0] && <span className="tabla__sub">Cupos de {m.horarios[0].duracion_cupo_min} min</span>}
                      </td>
                      <td data-titulo="Acceso"><Acceso usuario={m.usuario} /></td>
                      <td className="tabla__acciones">
                        <div className="acciones-cita acciones-cita--3">
                          <button className="boton-chico" onClick={() => setModal({ tipo: 'medico', dato: m })}><Icono nombre="editar" tamano={16} /><span>Datos</span></button>
                          <button className="boton-chico" onClick={() => setModal({ tipo: 'horario', dato: m })}><Icono nombre="reloj" tamano={16} /><span>Horario</span></button>
                          <button className="boton-chico" onClick={() => setModal({ tipo: 'acceso', dato: m })}><Icono nombre="candado" tamano={16} /><span>Acceso</span></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {actual.rol && (
        <TablaUsuarios usuarios={usuarios?.filter((u) => u.rol === actual.rol)} rol={actual.rol}
          onRestablecer={(u) => setModal({ tipo: 'clave', dato: u })} onActivo={cambiarActivo} />
      )}

      {pestana === 'especialidades' && (
        <div className="tarjeta tarjeta--tabla">
          {especialidades === null ? <p className="cargando">Cargando…</p> : (
            <table className="tabla">
              <thead><tr><th>Especialidad</th><th>Médicos</th><th aria-label="Acciones" /></tr></thead>
              <tbody>
                {especialidades.map((e) => (
                  <tr key={e.id_especialidad}>
                    <td data-titulo="Especialidad"><strong>{e.nombre}</strong></td>
                    <td data-titulo="Médicos">{e.medicos || <span className="texto-suave">Ninguno aún</span>}</td>
                    <td className="tabla__acciones">
                      <button className="boton-chico" onClick={() => setModal({ tipo: 'especialidad', dato: e })}><Icono nombre="editar" tamano={16} /><span>Renombrar</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal?.tipo === 'medico' && (
        <ModalMedico medico={modal.dato} onCerrar={cerrar}
          onGuardado={({ medico, clave_temporal: clave }, esNuevo) => {
            if (!esNuevo) return listo('Datos del médico actualizados.')
            // Al registrar, se pasa directo a definir su horario
            return listo(`${nombreCompleto(medico)} registrado. Ahora define su horario de atención.`,
              { tipo: 'horario', dato: { ...medico, horarios: [] }, clave })
          }} />
      )}
      {modal?.tipo === 'horario' && (
        <ModalHorario medico={modal.dato} claveNueva={modal.clave} onCerrar={cerrar}
          onGuardado={() => listo(`Horario de ${nombreCompleto(modal.dato)} guardado. Sus cupos ya se ven en la agenda.`)} />
      )}
      {modal?.tipo === 'acceso' && <ModalAccesoMedico medico={modal.dato} onCerrar={cerrar} onCambio={recargar} />}
      {modal?.tipo === 'usuario' && <ModalNuevoUsuario rol={modal.rol} onCerrar={cerrar} onCreado={recargar} />}
      {modal?.tipo === 'clave' && <ModalRestablecer usuario={modal.dato} onCerrar={cerrar} />}
      {modal?.tipo === 'especialidad' && (
        <ModalEspecialidad especialidad={modal.dato} onCerrar={cerrar}
          onGuardada={(e, esNueva) => listo(esNueva ? `Especialidad «${e.nombre}» creada. Ya se puede asignar a los médicos.` : 'Especialidad renombrada.')} />
      )}
    </section>
  )
}

function TablaUsuarios({ usuarios, rol, onRestablecer, onActivo }) {
  if (!usuarios) return <div className="tarjeta"><p className="cargando">Cargando…</p></div>
  if (!usuarios.length) return <div className="vacio"><p>Aún no hay usuarios con el rol {NOMBRE_ROL[rol].toLowerCase()}.</p></div>
  return (
    <div className="tarjeta tarjeta--tabla">
      <table className="tabla">
        <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id_usuario} className={u.activo ? undefined : 'tabla__fila--apagada'}>
              <td data-titulo="Usuario"><strong>{u.username}</strong></td>
              <td data-titulo="Rol">{NOMBRE_ROL[u.rol]}</td>
              <td data-titulo="Estado"><span className={`estado estado--${u.activo ? 'confirmada' : 'inasistente'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td className="tabla__acciones">
                <button className="boton-chico" onClick={() => onRestablecer(u)}><Icono nombre="candado" tamano={16} /><span>Restablecer contraseña</span></button>
                <button className={`boton-chico${u.activo ? ' boton-chico--peligro' : ' boton-chico--exito'}`} onClick={() => onActivo(u)}>
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ModalEspecialidad({ especialidad, onCerrar, onGuardada }) {
  const [nombre, setNombre] = useState(especialidad?.nombre ?? '')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      onGuardada(await especialidadesApi.guardar({ id_especialidad: especialidad?.id_especialidad, nombre }), !especialidad)
    } catch (err) {
      setError(mensajeError(err))
      setOcupado(false)
    }
  }

  return (
    <Modal titulo={especialidad ? 'Renombrar especialidad' : 'Nueva especialidad'} onCerrar={onCerrar}
      pie={(
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button className="boton" form="form-especialidad" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar'}</button>
        </>
      )}>
      <form id="form-especialidad" onSubmit={guardar}>
        {error && <p className="alerta alerta--error">{error}</p>}
        <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} required placeholder="Ej. Neurología" /></label>
        <p className="nota">Las especialidades no se eliminan: los médicos y citas que la usan se conservan.</p>
      </form>
    </Modal>
  )
}

function Acceso({ usuario }) {
  if (!usuario) return <span className="texto-suave">Sin usuario</span>
  return (
    <span className="acceso-usuario">
      <span>{usuario.username}</span>
      <span className={`estado estado--${usuario.activo ? 'confirmada' : 'inasistente'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span>
    </span>
  )
}

function ModalMedico({ medico, onCerrar, onGuardado }) {
  const esNuevo = !medico
  const [especialidades, setEspecialidades] = useState([])
  const [datos, setDatos] = useState({
    nombres: medico?.nombres ?? '', apellidos: medico?.apellidos ?? '', colegiatura: medico?.colegiatura ?? '',
    id_especialidad: medico?.id_especialidad ?? '', crear_usuario: true, username: '',
  })
  const [usuarioEditado, setUsuarioEditado] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => { especialidadesApi.listar().then(setEspecialidades) }, [])

  function cambiar(e) {
    const { name, value, type, checked } = e.target
    const nuevo = { ...datos, [name]: type === 'checkbox' ? checked : value }
    if (esNuevo && !usuarioEditado && (name === 'nombres' || name === 'apellidos')) nuevo.username = sugerirUsuario(nuevo.nombres, nuevo.apellidos)
    if (name === 'username') setUsuarioEditado(true)
    setDatos(nuevo)
  }

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      onGuardado(await medicosAdminApi.guardar({ ...datos, id_medico: medico?.id_medico }), esNuevo)
    } catch (err) {
      setError(mensajeError(err))
      setOcupado(false)
    }
  }

  return (
    <Modal titulo={esNuevo ? 'Nuevo médico' : 'Datos del médico'} ancho="ancho" onCerrar={onCerrar}
      subtitulo={esNuevo ? 'Después de guardar, definirás su horario de atención.' : `${nombreCompleto(medico)} · ${medico.colegiatura}`}
      pie={(
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button className="boton" form="form-medico" disabled={ocupado}>{ocupado ? 'Guardando…' : esNuevo ? 'Registrar y definir horario' : 'Guardar cambios'}</button>
        </>
      )}>
      <form id="form-medico" onSubmit={guardar}>
        {error && <p className="alerta alerta--error">{error}</p>}
        <div className="formulario">
          <label>Nombres<input name="nombres" value={datos.nombres} onChange={cambiar} maxLength={80} required /></label>
          <label>Apellidos<input name="apellidos" value={datos.apellidos} onChange={cambiar} maxLength={80} required /></label>
          <label>Colegiatura (CMP)<input name="colegiatura" value={datos.colegiatura} onChange={cambiar} maxLength={12} placeholder="CMP10009" required /></label>
          <label>Especialidad
            <select name="id_especialidad" value={datos.id_especialidad} onChange={cambiar} required>
              <option value="">Selecciona…</option>
              {especialidades.map((e) => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
            </select>
          </label>
          {esNuevo && (
            <div className="ancho-completo bloque-acceso">
              <label className="casilla">
                <input type="checkbox" name="crear_usuario" checked={datos.crear_usuario} onChange={cambiar} />
                Crear su usuario para entrar al sistema
              </label>
              {datos.crear_usuario && (
                <label>Usuario
                  <input name="username" value={datos.username} onChange={cambiar} maxLength={40} required placeholder="Ej. jperez" />
                </label>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}

function ModalHorario({ medico, claveNueva, onCerrar, onGuardado }) {
  const [turnos, setTurnos] = useState(() => medico.horarios.map((h) => ({
    dia_semana: h.dia_semana, hora_inicio: horaCorta(h.hora_inicio), hora_fin: horaCorta(h.hora_fin), duracion_cupo_min: h.duracion_cupo_min,
  })))
  const [duracion, setDuracion] = useState(medico.horarios[0]?.duracion_cupo_min ?? 20)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const delDia = (dia) => turnos.map((t, i) => ({ ...t, i })).filter((t) => t.dia_semana === dia)
  const agregar = (dia) => {
    const previo = delDia(dia).at(-1)
    setTurnos([...turnos, previo ? { dia_semana: dia, hora_inicio: '15:00', hora_fin: '19:00', duracion_cupo_min: duracion }
      : { dia_semana: dia, hora_inicio: '08:00', hora_fin: '13:00', duracion_cupo_min: duracion }])
  }
  const quitar = (i) => setTurnos(turnos.filter((_, j) => j !== i))
  const cambiar = (i, campo, valor) => setTurnos(turnos.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)))
  const copiarLunes = () => {
    const lunes = delDia(1)
    if (!lunes.length) return
    setTurnos([...lunes.map(({ i, ...t }) => t), ...[2, 3, 4, 5].flatMap((dia) => lunes.map(({ i, ...t }) => ({ ...t, dia_semana: dia }))),
      ...turnos.filter((t) => t.dia_semana >= 6)])
  }

  const conDuracion = turnos.map((t) => ({ ...t, duracion_cupo_min: duracion }))
  const totalCupos = conDuracion.reduce((s, t) => s + cuposDe(t), 0)

  async function guardar() {
    setError('')
    setOcupado(true)
    try {
      await medicosAdminApi.guardarHorario(medico.id_medico, conDuracion)
      onGuardado()
    } catch (err) {
      setError(mensajeError(err))
      setOcupado(false)
    }
  }

  return (
    <Modal titulo="Horario de atención" ancho="ancho" onCerrar={onCerrar}
      subtitulo={`${nombreCompleto(medico)} · ${medico.especialidad}`}
      pie={(
        <>
          <span className="modal__resumen">{totalCupos} cupos por semana</span>
          <button className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button className="boton" onClick={guardar} disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar horario'}</button>
        </>
      )}>
      {claveNueva && <ClaveTemporal clave={claveNueva} texto="Usuario creado. Entrega esta contraseña temporal al médico:" />}
      {error && <p className="alerta alerta--error">{error}</p>}

      <div className="horario-opciones">
        <label className="selector-inline">
          <span>Duración de cada cupo</span>
          <select value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
            {DURACIONES.map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </label>
        <button type="button" className="enlace" onClick={copiarLunes} disabled={!delDia(1).length}>Copiar el lunes de martes a viernes</button>
      </div>

      <ul className="semana">
        {DIAS_LARGOS.map((nombre, i) => {
          const dia = i + 1
          const lista = delDia(dia)
          return (
            <li key={dia} className={`semana__dia${lista.length ? '' : ' semana__dia--libre'}`}>
              <span className="semana__nombre">{nombre}</span>
              <div className="semana__turnos">
                {lista.length === 0 && <span className="texto-suave">No atiende</span>}
                {lista.map((t) => (
                  <span key={t.i} className="turno">
                    <input type="time" value={t.hora_inicio} step={300} onChange={(e) => cambiar(t.i, 'hora_inicio', e.target.value)} aria-label={`${nombre}: inicio`} />
                    <span className="texto-suave">a</span>
                    <input type="time" value={t.hora_fin} step={300} onChange={(e) => cambiar(t.i, 'hora_fin', e.target.value)} aria-label={`${nombre}: fin`} />
                    <span className="turno__cupos">{cuposDe({ ...t, duracion_cupo_min: duracion })} cupos</span>
                    <button type="button" className="boton-icono boton-icono--chico" onClick={() => quitar(t.i)} aria-label={`Quitar turno del ${nombre}`}>
                      <Icono nombre="cerrar" tamano={16} />
                    </button>
                  </span>
                ))}
              </div>
              <button type="button" className="boton-chico" onClick={() => agregar(dia)}>
                <Icono nombre="mas" tamano={16} /><span>{lista.length ? 'Turno' : 'Agregar'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="nota"><Icono nombre="alerta" tamano={16} />Si un cambio deja fuera citas ya agendadas, el sistema no lo guarda hasta que se reprogramen.</p>
    </Modal>
  )
}

function ModalAccesoMedico({ medico, onCerrar, onCambio }) {
  const [usuario, setUsuario] = useState(medico.usuario)
  const [username, setUsername] = useState(sugerirUsuario(medico.nombres, medico.apellidos))
  const [clave, setClave] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function ejecutar(accion) {
    setError('')
    setOcupado(true)
    try {
      await accion()
      onCambio()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const crear = () => ejecutar(async () => {
    const r = await medicosAdminApi.crearUsuario(medico.id_medico, username)
    setClave(r.clave_temporal)
    setUsuario(r.usuario)
  })

  return (
    <Modal titulo="Acceso al sistema" onCerrar={onCerrar} subtitulo={`${nombreCompleto(medico)} · ${medico.colegiatura}`}
      pie={<button className="boton boton--secundario" onClick={onCerrar}>Cerrar</button>}>
      {error && <p className="alerta alerta--error">{error}</p>}
      {clave && <ClaveTemporal clave={clave} />}
      {!usuario ? (
        <form onSubmit={(e) => { e.preventDefault(); crear() }}>
          <p className="texto-suave modal__texto">Este médico aún no tiene usuario. Sus citas se agendan igual, pero no puede ver su agenda ni la HCE.</p>
          <label>Usuario<input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={40} required /></label>
          <div className="acciones-form"><button className="boton" disabled={ocupado}>Crear usuario</button></div>
        </form>
      ) : (
        <AccionesUsuario usuario={usuario} ocupado={ocupado}
          onRestablecer={() => ejecutar(async () => setClave((await usuariosAdminApi.restablecerClave(usuario.id_usuario)).clave_temporal))}
          onActivo={() => ejecutar(async () => setUsuario(await usuariosAdminApi.cambiarActivo(usuario.id_usuario, !usuario.activo)))} />
      )}
    </Modal>
  )
}

function AccionesUsuario({ usuario, ocupado, onRestablecer, onActivo }) {
  return (
    <>
      <dl className="datos">
        <dt>Usuario</dt><dd><strong>{usuario.username}</strong></dd>
        <dt>Rol</dt><dd>Médico</dd>
        <dt>Estado</dt><dd><span className={`estado estado--${usuario.activo ? 'confirmada' : 'inasistente'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span></dd>
      </dl>
      <div className="acciones-form acciones-form--izquierda">
        <button className="boton boton--secundario boton--con-icono" onClick={onRestablecer} disabled={ocupado}>
          <Icono nombre="candado" /><span>Restablecer contraseña</span>
        </button>
        <button className={`boton ${usuario.activo ? 'boton--peligro' : ''}`} onClick={onActivo} disabled={ocupado}>
          {usuario.activo ? 'Desactivar acceso' : 'Activar acceso'}
        </button>
      </div>
      <p className="nota">Desactivar no borra al médico ni su historial: solo impide que inicie sesión.</p>
    </>
  )
}

function ModalNuevoUsuario({ rol, onCerrar, onCreado }) {
  const [username, setUsername] = useState('')
  const [clave, setClave] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function crear(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      setClave((await usuariosAdminApi.crear({ username, rol })).clave_temporal)
      onCreado()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Modal titulo={rol === 'enfermera' ? 'Nueva enfermera' : 'Nuevo recepcionista'} onCerrar={onCerrar}
      subtitulo={rol === 'enfermera' ? 'Crea su usuario para registrar triajes.' : 'Crea su usuario para registrar pacientes y citas.'}
      pie={clave ? <button className="boton" onClick={onCerrar}>Listo</button> : (
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button className="boton" form="form-usuario" disabled={ocupado}>{ocupado ? 'Creando…' : 'Crear usuario'}</button>
        </>
      )}>
      {clave ? <ClaveTemporal clave={clave} texto={`Usuario «${username}» creado. Entrégale esta contraseña temporal:`} /> : (
        <form id="form-usuario" onSubmit={crear}>
          {error && <p className="alerta alerta--error">{error}</p>}
          <label>Usuario
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} maxLength={40} required placeholder={rol === 'enfermera' ? 'Ej. mquispe' : 'Ej. lrojas'} />
          </label>
          <p className="nota">Minúsculas, números, punto o guion bajo (3 a 40 caracteres).</p>
        </form>
      )}
    </Modal>
  )
}

function ModalRestablecer({ usuario, onCerrar }) {
  const [clave, setClave] = useState(null)
  const [error, setError] = useState('')
  const restablecer = () => usuariosAdminApi.restablecerClave(usuario.id_usuario).then((r) => setClave(r.clave_temporal)).catch((e) => setError(mensajeError(e)))

  return (
    <Modal titulo="Restablecer contraseña" onCerrar={onCerrar} subtitulo={`Usuario «${usuario.username}»`}
      pie={clave ? <button className="boton" onClick={onCerrar}>Listo</button> : (
        <>
          <button className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button className="boton" onClick={restablecer}>Generar contraseña temporal</button>
        </>
      )}>
      {error && <p className="alerta alerta--error">{error}</p>}
      {clave ? <ClaveTemporal clave={clave} /> : (
        <p className="texto-suave modal__texto">Se generará una contraseña temporal. La actual dejará de funcionar.</p>
      )}
    </Modal>
  )
}

function ClaveTemporal({ clave, texto = 'Entrega esta contraseña temporal al trabajador:' }) {
  return (
    <div className="clave-temporal">
      <span>{texto}</span>
      <code>{clave}</code>
      <span className="texto-suave">Se muestra una sola vez; anótala antes de cerrar.</span>
    </div>
  )
}
