// HU04 HCE unificada · HU05 consulta con CIE-10 y receta · HU06 imprimir receta · HU12 anular con motivo.
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import Encabezado from '../../../compartido/componentes/Encabezado.jsx'
import Icono from '../../../compartido/componentes/Icono.jsx'
import Modal from '../../../compartido/componentes/Modal.jsx'
import { edad, fechaCorta, fechaHora, nombreCompleto, nombreMedico } from '../../../compartido/utilidades/formato.js'
import { consultasApi, historiasApi } from '../api.js'
import BuscadorPaciente from '../componentes/BuscadorPaciente.jsx'
import FormularioConsulta from '../componentes/FormularioConsulta.jsx'
import RecetaImprimible from '../componentes/RecetaImprimible.jsx'
import SignosVitales from '../componentes/SignosVitales.jsx'

export default function HistoriaClinica() {
  const { idPaciente } = useParams()
  const navigate = useNavigate()

  if (!idPaciente) {
    return (
      <section>
        <Encabezado titulo="Historia clínica" descripcion="Busca al paciente para abrir su historia clínica unificada." />
        <div className="tarjeta tarjeta--angosta">
          <BuscadorPaciente paciente={null} autoFocus onSeleccionar={(p) => p && navigate(`/hce/${p.id_paciente}`)} />
        </div>
      </section>
    )
  }
  return <VistaHistoria key={idPaciente} idPaciente={idPaciente} />
}

function VistaHistoria({ idPaciente }) {
  const [hce, setHce] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [nuevaConsulta, setNuevaConsulta] = useState(false)
  const [anulando, setAnulando] = useState(null)
  const [imprimir, setImprimir] = useState(null)

  const cargar = useCallback(() => historiasApi.obtener(idPaciente).then(setHce).catch((e) => setError(mensajeError(e))), [idPaciente])
  useEffect(() => { cargar() }, [cargar])

  if (error) return <p className="alerta alerta--error">{error}</p>
  if (!hce) return <p className="cargando">Abriendo historia clínica…</p>

  const { paciente } = hce
  const alergias = hce.alergias?.split(',').map((a) => a.trim()).filter(Boolean) ?? []
  const vigentes = hce.consultas.filter((c) => !c.anulada).length

  return (
    <section>
      <Encabezado titulo={nombreCompleto(paciente)}
        descripcion={`${paciente.numero_hce} · DNI ${paciente.dni} · ${edad(paciente.fecha_nacimiento)} años`}>
        <Link className="boton boton--secundario boton--con-icono" to="/hce"><Icono nombre="buscar" /><span>Otro paciente</span></Link>
        {hce.citas_por_atender.length > 0 && !nuevaConsulta && (
          <button className="boton boton--con-icono" onClick={() => { setNuevaConsulta(true); setMensaje(null) }}>
            <Icono nombre="mas" /><span>Nueva consulta</span>
          </button>
        )}
      </Encabezado>

      {mensaje && (
        <p className={`alerta alerta--${mensaje.tipo} alerta--con-accion`}>
          <span>{mensaje.texto}</span>
          {mensaje.receta && (
            <button className="boton-chico" onClick={() => setImprimir(mensaje.receta)}>
              <Icono nombre="imprimir" tamano={16} /><span>Imprimir receta</span>
            </button>
          )}
        </p>
      )}

      <div className="dos-columnas">
        <aside>
          <div className="tarjeta">
            <h2>Datos del paciente</h2>
            <dl className="datos">
              <dt>Nacimiento</dt><dd>{fechaCorta(paciente.fecha_nacimiento)}</dd>
              <dt>Teléfono</dt><dd>{paciente.telefono || '—'}</dd>
              <dt>Correo</dt><dd>{paciente.email || '—'}</dd>
              <dt>Antecedentes</dt><dd>{hce.antecedentes || 'Sin antecedentes registrados'}</dd>
              <dt>Alergias</dt>
              <dd>
                {alergias.length === 0 ? 'No refiere' : (
                  <span className="chips">{alergias.map((a) => <span key={a} className="chip chip--alerta">{a}</span>)}</span>
                )}
              </dd>
            </dl>
          </div>
          <div className="tarjeta">
            <div className="tarjeta__cabeza">
              <h2>Último triaje</h2>
              {hce.triaje_reciente && <span className="texto-suave">{fechaHora(hce.triaje_reciente.fecha_registro)}</span>}
            </div>
            {hce.triaje_reciente ? <SignosVitales triaje={hce.triaje_reciente} /> : <p className="texto-suave">Sin triajes registrados.</p>}
          </div>
        </aside>

        <div>
          {nuevaConsulta && (
            <FormularioConsulta paciente={paciente} citas={hce.citas_por_atender} onCancelar={() => setNuevaConsulta(false)}
              onGuardada={(consulta, receta) => {
                setNuevaConsulta(false)
                setMensaje({ tipo: 'exito', texto: 'Consulta registrada en la historia clínica.', receta: receta && { ...receta, consulta } })
                cargar()
              }} />
          )}

          <div className="tarjeta">
            <div className="tarjeta__cabeza">
              <h2>Atenciones previas</h2>
              <span className="texto-suave">{vigentes} {vigentes === 1 ? 'atención' : 'atenciones'}</span>
            </div>
            {hce.consultas.length === 0 && <p className="texto-suave">El paciente aún no tiene atenciones registradas.</p>}
            <ol className="atenciones">
              {hce.consultas.map((c) => (
                <Atencion key={c.id_consulta} consulta={c}
                  onAnular={() => setAnulando(c)}
                  onImprimir={() => setImprimir({ ...c.receta, consulta: c })} />
              ))}
            </ol>
            <p className="nota">Las entradas no se eliminan: se anulan con motivo y quedan registradas en la bitácora.</p>
          </div>
        </div>
      </div>

      {anulando && (
        <ModalAnular consulta={anulando} onCerrar={() => setAnulando(null)}
          onListo={() => { setAnulando(null); setMensaje({ tipo: 'exito', texto: 'Entrada anulada. Se conserva en la historia con su motivo.' }); cargar() }} />
      )}
      {imprimir && (
        <RecetaImprimible receta={imprimir} paciente={paciente} onTerminar={() => setImprimir(null)} />
      )}
    </section>
  )
}

function Atencion({ consulta: c, onAnular, onImprimir }) {
  return (
    <li className={`atencion${c.anulada ? ' atencion--anulada' : ''}`}>
      <div className="atencion__cabeza">
        <span><strong>{fechaHora(c.fecha_consulta)}</strong> · {nombreMedico(c.medico)} · {c.medico.especialidad}</span>
        {c.anulada && <span className="estado estado--cancelada">Anulada</span>}
      </div>
      <p className="atencion__motivo">{c.motivo}</p>
      {c.evolucion && <p className="atencion__texto">{c.evolucion}</p>}
      <div className="chips">
        {c.diagnosticos.map((d) => (
          <span key={d.codigo_cie10} className={`chip${d.es_principal ? ' chip--principal' : ''}`} title={d.es_principal ? 'Diagnóstico principal' : undefined}>
            <strong>{d.codigo_cie10}</strong> {d.descripcion}
          </span>
        ))}
      </div>
      {c.receta && (
        <details className="atencion__receta">
          <summary>Ver receta</summary>
          <p>{c.receta.indicaciones}</p>
        </details>
      )}
      {c.anulada ? (
        <p className="atencion__anulacion">
          Anulada por el usuario «{c.anulada_por_usuario}» el {fechaHora(c.fecha_anulacion)}. Motivo: {c.motivo_anulacion}
        </p>
      ) : (
        <div className="atencion__acciones">
          {c.receta && (
            <button className="boton-chico" onClick={onImprimir}><Icono nombre="imprimir" tamano={16} /><span>Imprimir receta</span></button>
          )}
          <button className="boton-chico boton-chico--peligro" onClick={onAnular}><Icono nombre="anular" tamano={16} /><span>Anular entrada</span></button>
        </div>
      )}
    </li>
  )
}

function ModalAnular({ consulta, onCerrar, onListo }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function anular(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      onListo(await consultasApi.anular(consulta.id_consulta, motivo))
    } catch (err) {
      setError(mensajeError(err))
      setOcupado(false)
    }
  }

  return (
    <Modal titulo="Anular entrada" onCerrar={onCerrar}
      subtitulo={`${fechaHora(consulta.fecha_consulta)} · ${consulta.motivo}`}
      pie={(
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Volver</button>
          <button className="boton boton--peligro" form="form-anular" disabled={ocupado || !motivo.trim()}>{ocupado ? 'Anulando…' : 'Anular entrada'}</button>
        </>
      )}>
      <form id="form-anular" onSubmit={anular}>
        {error && <p className="alerta alerta--error">{error}</p>}
        <label>Motivo de la anulación
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} maxLength={300} required
            placeholder="Ej. Se registró en el paciente equivocado" />
        </label>
        <p className="nota">La entrada no se borra: queda tachada en la historia con tu usuario, la fecha y el motivo.</p>
      </form>
    </Modal>
  )
}
