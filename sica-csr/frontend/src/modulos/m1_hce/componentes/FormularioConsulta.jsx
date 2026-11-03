// HU05 · Registrar la atención con diagnósticos CIE-10 (uno principal) y receta. La cita pasa a «atendida».
import { useEffect, useState } from 'react'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import Icono from '../../../compartido/componentes/Icono.jsx'
import { ESTADOS_CITA, horaCorta, hoyISO, nombreMedico } from '../../../compartido/utilidades/formato.js'
import { cie10Api, consultasApi } from '../api.js'

export default function FormularioConsulta({ paciente, citas, onCancelar, onGuardada }) {
  const [idCita, setIdCita] = useState(citas.find((c) => c.estado === 'triada')?.id_cita ?? citas[0].id_cita)
  const [motivo, setMotivo] = useState('')
  const [evolucion, setEvolucion] = useState('')
  const [diagnosticos, setDiagnosticos] = useState([]) // [{ codigo_cie10, descripcion, es_principal }]
  const [indicaciones, setIndicaciones] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cita = citas.find((c) => c.id_cita === Number(idCita))

  function agregar(d) {
    if (diagnosticos.some((x) => x.codigo_cie10 === d.codigo)) return
    setDiagnosticos([...diagnosticos, { codigo_cie10: d.codigo, descripcion: d.descripcion, es_principal: diagnosticos.length === 0 }])
  }
  function quitar(codigo) {
    const resto = diagnosticos.filter((d) => d.codigo_cie10 !== codigo)
    if (resto.length && !resto.some((d) => d.es_principal)) resto[0] = { ...resto[0], es_principal: true }
    setDiagnosticos(resto)
  }
  const hacerPrincipal = (codigo) => setDiagnosticos(diagnosticos.map((d) => ({ ...d, es_principal: d.codigo_cie10 === codigo })))

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setOcupado(true)
    try {
      const consulta = await consultasApi.registrar({ paciente, id_cita: cita.id_cita, motivo, evolucion, diagnosticos, indicaciones })
      const receta = indicaciones.trim() ? { indicaciones: indicaciones.trim(), fecha_emision: hoyISO() } : null
      onGuardada({ ...consulta, medico: cita.medico, diagnosticos }, receta)
    } catch (err) {
      setError(mensajeError(err))
      setOcupado(false)
    }
  }

  return (
    <form className="tarjeta tarjeta--destacada" onSubmit={guardar}>
      <div className="tarjeta__cabeza">
        <h2>Nueva consulta</h2>
        <button type="button" className="boton-icono" onClick={onCancelar} aria-label="Cerrar"><Icono nombre="cerrar" /></button>
      </div>
      {error && <p className="alerta alerta--error">{error}</p>}

      <div className="formulario">
        <label className="ancho-completo">Cita
          <select value={idCita} onChange={(e) => setIdCita(e.target.value)}>
            {citas.map((c) => (
              <option key={c.id_cita} value={c.id_cita}>Hoy {horaCorta(c.hora)} · {nombreMedico(c.medico)} · {ESTADOS_CITA[c.estado]}</option>
            ))}
          </select>
        </label>
        <label className="ancho-completo">Motivo de consulta
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} required placeholder="Ej. Control de presión arterial" />
        </label>
        <label className="ancho-completo"><span>Evolución y examen <span className="opcional">(opcional)</span></span>
          <textarea value={evolucion} onChange={(e) => setEvolucion(e.target.value)} rows={3} />
        </label>

        <div className="ancho-completo">
          <BuscadorCie10 onElegir={agregar} />
          {diagnosticos.length > 0 && (
            <ul className="diagnosticos">
              {diagnosticos.map((d) => (
                <li key={d.codigo_cie10}>
                  <span className="codigo">{d.codigo_cie10}</span>
                  <span className="diagnosticos__texto">{d.descripcion}</span>
                  <label className="diagnosticos__principal">
                    <input type="radio" name="principal" checked={d.es_principal} onChange={() => hacerPrincipal(d.codigo_cie10)} />
                    Principal
                  </label>
                  <button type="button" className="boton-icono boton-icono--chico" onClick={() => quitar(d.codigo_cie10)} aria-label={`Quitar ${d.codigo_cie10}`}>
                    <Icono nombre="cerrar" tamano={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="ancho-completo"><span>Receta e indicaciones <span className="opcional">(opcional)</span></span>
          <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows={4}
            placeholder={'Medicamento, dosis, frecuencia y duración. Una indicación por línea.'} />
        </label>
      </div>

      <div className="acciones-form">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>Cancelar</button>
        <button className="boton" disabled={ocupado || !diagnosticos.length}>{ocupado ? 'Guardando…' : 'Guardar consulta'}</button>
      </div>
    </form>
  )
}

function BuscadorCie10({ onElegir }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    if (texto.trim().length < 2) { setResultados([]); return undefined }
    const t = setTimeout(() => cie10Api.buscar(texto).then(setResultados), 250)
    return () => clearTimeout(t)
  }, [texto])

  return (
    <div className="buscador">
      <label className="buscador__etiqueta" htmlFor="buscador-cie10">Diagnósticos CIE-10</label>
      <div className="campo-icono">
        <Icono nombre="buscar" />
        <input id="buscador-cie10" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off"
          placeholder="Código o descripción, p. ej. I10 o hipertensión"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (resultados[0]) { onElegir(resultados[0]); setTexto('') } } }} />
      </div>
      {resultados.length > 0 && (
        <ul className="buscador__lista">
          {resultados.map((d) => (
            <li key={d.codigo}>
              <button type="button" className="buscador__opcion buscador__opcion--fila" onClick={() => { onElegir(d); setTexto('') }}>
                <span className="codigo">{d.codigo}</span><span>{d.descripcion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
