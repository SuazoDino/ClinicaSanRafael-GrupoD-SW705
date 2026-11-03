// HU01 cupos libres · HU02 sin cupos duplicados · HU07 asistencia · HU09 recordatorio · HU10 reprogramar o cancelar.
// PROTOTIPO: citas y cupos vienen de la BD simulada (ver api.js); los pacientes, de la API real.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import Encabezado from '../../../compartido/componentes/Encabezado.jsx'
import EstadoCita from '../../../compartido/componentes/EstadoCita.jsx'
import Icono from '../../../compartido/componentes/Icono.jsx'
import Modal from '../../../compartido/componentes/Modal.jsx'
import { fechaLarga, horaCorta, hoyISO, nombreCompleto, nombreMedico } from '../../../compartido/utilidades/formato.js'
import BuscadorPaciente from '../../m1_hce/componentes/BuscadorPaciente.jsx'
import { pacientesApi } from '../../m1_hce/api.js'
import { citasApi, especialidadesApi, medicosApi } from '../api.js'
import SelectorCupos from '../componentes/SelectorCupos.jsx'

const CANAL = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Correo' }

export default function AgendaCitas() {
  const [params, setParams] = useSearchParams()
  const [paciente, setPaciente] = useState(null)
  const [especialidades, setEspecialidades] = useState([])
  const [medicos, setMedicos] = useState([])
  const [idEspecialidad, setIdEspecialidad] = useState('')
  const [idMedico, setIdMedico] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [hora, setHora] = useState(null)
  const [citas, setCitas] = useState([])
  const [version, setVersion] = useState(0) // al cambiar, se recargan cupos y citas
  const [mensaje, setMensaje] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [reprogramando, setReprogramando] = useState(null)
  const [cancelando, setCancelando] = useState(null)

  const recargar = () => setVersion((v) => v + 1)
  const medico = medicos.find((m) => m.id_medico === Number(idMedico))

  // Paciente preseleccionado desde la pantalla Pacientes (/agenda?paciente=12)
  useEffect(() => {
    const id = params.get('paciente')
    if (id) pacientesApi.obtener(id).then(setPaciente).catch(() => {})
  }, [params])

  useEffect(() => { especialidadesApi.listar().then(setEspecialidades) }, [])
  useEffect(() => { medicosApi.listar(idEspecialidad).then(setMedicos) }, [idEspecialidad])
  useEffect(() => { citasApi.listar({ fecha, idMedico }).then(setCitas) }, [fecha, idMedico, version])

  function elegirPaciente(p) {
    setPaciente(p)
    if (!p && params.has('paciente')) setParams({}, { replace: true })
  }

  async function confirmar() {
    setMensaje(null)
    setOcupado(true)
    try {
      const cita = await citasApi.registrar({ paciente, id_medico: medico.id_medico, fecha, hora })
      setMensaje({ tipo: 'exito', texto: `Cita registrada: ${nombreCompleto(cita.paciente)} con ${nombreMedico(cita.medico)}, ${fechaLarga(fecha)} a las ${horaCorta(hora)}. Se programó el recordatorio 24 h antes.` })
      setHora(null)
      setPaciente(null)
      if (params.has('paciente')) setParams({}, { replace: true })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setOcupado(false)
      recargar()
    }
  }

  async function asistencia(cita, asistio) {
    setMensaje(null)
    try {
      await citasApi.marcarAsistencia(cita.id_cita, asistio)
      setMensaje({ tipo: 'exito', texto: `${nombreCompleto(cita.paciente)}: ${asistio ? 'asistencia registrada, pasa a triaje' : 'marcado como inasistente'}.` })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    }
    recargar()
  }

  return (
    <section>
      <Encabezado titulo="Agenda de citas" descripcion="Disponibilidad consolidada por especialidad, médico y fecha." />

      <div className="tarjeta">
        <h2>Nueva cita</h2>
        <div className="rejilla-3">
          <BuscadorPaciente paciente={paciente} onSeleccionar={elegirPaciente} />
          <label>Especialidad
            <select value={idEspecialidad} onChange={(e) => { setIdEspecialidad(e.target.value); setIdMedico(''); setHora(null) }}>
              <option value="">Todas</option>
              {especialidades.map((e) => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
            </select>
          </label>
          <label>Médico
            <select value={idMedico} onChange={(e) => { setIdMedico(e.target.value); setHora(null) }}>
              <option value="">Selecciona un médico</option>
              {medicos.map((m) => <option key={m.id_medico} value={m.id_medico}>{nombreMedico(m)} — {m.especialidad}</option>)}
            </select>
          </label>
        </div>

        <SelectorCupos idMedico={idMedico} fecha={fecha} onFecha={(f) => { setFecha(f); setHora(null) }}
          hora={hora} onHora={setHora} version={version} />

        {hora && (
          <div className="confirmar">
            <p>
              {paciente ? <strong>{nombreCompleto(paciente)}</strong> : <span className="texto-suave">Falta elegir al paciente</span>}
              {' '}· {nombreMedico(medico)} · {fechaLarga(fecha)} · {horaCorta(hora)}
            </p>
            <button className="boton" onClick={confirmar} disabled={!paciente || ocupado}>
              {ocupado ? 'Registrando…' : 'Confirmar cita'}
            </button>
          </div>
        )}
      </div>

      {mensaje && <p className={`alerta alerta--${mensaje.tipo}`}>{mensaje.texto}</p>}

      <div className="tarjeta tarjeta--tabla">
        <div className="tarjeta__cabeza">
          <h2>Citas del {fechaLarga(fecha).toLowerCase()}</h2>
          <span className="texto-suave">{medico ? nombreMedico(medico) : 'Todos los médicos'} · {citas.length} {citas.length === 1 ? 'cita' : 'citas'}</span>
        </div>
        {citas.length === 0 ? (
          <div className="vacio vacio--plano"><p>No hay citas para este día.</p></div>
        ) : (
          <table className="tabla">
            <thead>
              <tr><th>Hora</th><th>Paciente</th>{!medico && <th>Médico</th>}<th>Estado</th><th>Recordatorio</th><th aria-label="Acciones" /></tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id_cita} className={c.estado === 'cancelada' ? 'tabla__fila--apagada' : undefined}>
                  <td data-titulo="Hora"><strong>{horaCorta(c.hora)}</strong></td>
                  <td data-titulo="Paciente">
                    {nombreCompleto(c.paciente)}
                    <span className="tabla__sub">DNI {c.paciente?.dni}</span>
                  </td>
                  {!medico && (
                    <td data-titulo="Médico">{nombreMedico(c.medico)}<span className="tabla__sub">{c.medico.especialidad}</span></td>
                  )}
                  <td data-titulo="Estado">
                    <EstadoCita estado={c.estado} />
                    {c.motivo_cancelacion && <span className="tabla__sub">{c.motivo_cancelacion}</span>}
                  </td>
                  <td data-titulo="Recordatorio"><Recordatorio r={c.recordatorio} /></td>
                  <td className="tabla__acciones">
                    <div className="acciones-cita">
                    {c.estado === 'registrada' && c.fecha === hoyISO() && (
                      <>
                        <button className="boton-chico boton-chico--exito" onClick={() => asistencia(c, true)}>
                          <Icono nombre="check" tamano={16} /><span>Asistió</span>
                        </button>
                        <button className="boton-chico" onClick={() => asistencia(c, false)}>No asistió</button>
                      </>
                    )}
                    {['registrada', 'confirmada'].includes(c.estado) && (
                      <>
                        <button className="boton-chico" onClick={() => setReprogramando(c)}>
                          <Icono nombre="repetir" tamano={16} /><span>Reprogramar</span>
                        </button>
                        <button className="boton-chico boton-chico--peligro" onClick={() => setCancelando(c)}>Cancelar</button>
                      </>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reprogramando && (
        <ModalReprogramar cita={reprogramando} onCerrar={() => setReprogramando(null)}
          onListo={(c) => {
            setReprogramando(null)
            setMensaje({ tipo: 'exito', texto: `Cita reprogramada para el ${fechaLarga(c.fecha).toLowerCase()} a las ${horaCorta(c.hora)}. El cupo anterior quedó libre.` })
            recargar()
          }} />
      )}
      {cancelando && (
        <ModalCancelar cita={cancelando} onCerrar={() => setCancelando(null)}
          onListo={() => { setCancelando(null); setMensaje({ tipo: 'exito', texto: 'Cita cancelada. El cupo quedó libre.' }); recargar() }} />
      )}
    </section>
  )
}

function Recordatorio({ r }) {
  if (!r) return <span className="texto-suave">—</span>
  const respuesta = r.respuesta === 'confirma' ? 'Confirmó' : r.respuesta === 'cancela' ? 'Pidió cancelar' : null
  return (
    <span className={`recordatorio recordatorio--${r.estado}`}>
      {CANAL[r.canal]} · {r.estado === 'pendiente' ? 'se envía 24 h antes' : r.estado === 'enviado' ? 'enviado' : 'falló el envío'}
      {respuesta && <span className="tabla__sub">{respuesta}</span>}
    </span>
  )
}

function ModalReprogramar({ cita, onCerrar, onListo }) {
  const [fecha, setFecha] = useState(cita.fecha < hoyISO() ? hoyISO() : cita.fecha)
  const [hora, setHora] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function guardar() {
    setError('')
    setOcupado(true)
    try {
      onListo(await citasApi.reprogramar(cita.id_cita, { fecha, hora }))
    } catch (err) {
      setError(mensajeError(err))
      setOcupado(false)
    }
  }

  return (
    <Modal titulo="Reprogramar cita" ancho="ancho" onCerrar={onCerrar}
      subtitulo={`${nombreCompleto(cita.paciente)} · ${nombreMedico(cita.medico)} · actual: ${fechaLarga(cita.fecha)}, ${horaCorta(cita.hora)}`}
      pie={(
        <>
          <button className="boton boton--secundario" onClick={onCerrar}>Volver</button>
          <button className="boton" onClick={guardar} disabled={!hora || ocupado}>{ocupado ? 'Guardando…' : 'Reprogramar'}</button>
        </>
      )}>
      {error && <p className="alerta alerta--error">{error}</p>}
      <SelectorCupos idMedico={cita.id_medico} fecha={fecha} onFecha={(f) => { setFecha(f); setHora(null) }} hora={hora} onHora={setHora} />
    </Modal>
  )
}

function ModalCancelar({ cita, onCerrar, onListo }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function cancelar(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      onListo(await citasApi.cancelar(cita.id_cita, motivo))
    } catch (err) {
      setError(mensajeError(err))
      setOcupado(false)
    }
  }

  return (
    <Modal titulo="Cancelar cita" onCerrar={onCerrar}
      subtitulo={`${nombreCompleto(cita.paciente)} · ${fechaLarga(cita.fecha)}, ${horaCorta(cita.hora)}`}
      pie={(
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Volver</button>
          <button className="boton boton--peligro" form="form-cancelar" disabled={ocupado || !motivo.trim()}>
            {ocupado ? 'Cancelando…' : 'Cancelar cita'}
          </button>
        </>
      )}>
      <form id="form-cancelar" onSubmit={cancelar}>
        {error && <p className="alerta alerta--error">{error}</p>}
        <label>Motivo de la cancelación
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} maxLength={200} required
            placeholder="Ej. El paciente no puede asistir por viaje" />
        </label>
        <p className="nota">La cita no se borra: queda como cancelada con su motivo y el cupo se libera.</p>
      </form>
    </Modal>
  )
}
