// HU08 · Agenda del día por médico: a qué pacientes atiende y en qué estado están.
// El médico ve la suya (id_medico de la sesión) y abre la HCE; recepción elige el médico y solo consulta (ERS 3.5).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSesion } from '../../../compartido/autenticacion/ContextoSesion.jsx'
import Encabezado from '../../../compartido/componentes/Encabezado.jsx'
import EstadoCita from '../../../compartido/componentes/EstadoCita.jsx'
import Icono from '../../../compartido/componentes/Icono.jsx'
import { edad, fechaLarga, horaCorta, hoyISO, nombreCompleto, nombreMedico } from '../../../compartido/utilidades/formato.js'
import { agendaMedicoApi, medicosApi } from '../api.js'

const POR_ATENDER = ['registrada', 'confirmada', 'triada']

export default function AgendaMedico() {
  const { usuario } = useSesion()
  const esMedico = Boolean(usuario.id_medico)
  const [medicos, setMedicos] = useState([])
  const [idMedico, setIdMedico] = useState(usuario.id_medico ?? 1)
  const [citas, setCitas] = useState(null)
  const fecha = hoyISO()

  useEffect(() => { medicosApi.listar().then(setMedicos) }, [])
  useEffect(() => { setCitas(null); agendaMedicoApi.delDia({ idMedico, fecha }).then(setCitas) }, [idMedico, fecha])

  const medico = medicos.find((m) => m.id_medico === Number(idMedico))
  const cuenta = (estados) => citas?.filter((c) => estados.includes(c.estado)).length ?? 0
  const siguiente = citas?.find((c) => ['triada', 'confirmada'].includes(c.estado))

  return (
    <section>
      <Encabezado titulo={esMedico ? 'Mi agenda del día' : 'Agenda por médico'}
        descripcion={`${fechaLarga(fecha)}${medico ? ` · ${nombreMedico(medico)}, ${medico.especialidad}` : ''}`}>
        {!esMedico && (
          <label className="selector-inline">
            <span>Médico</span>
            <select value={idMedico} onChange={(e) => setIdMedico(Number(e.target.value))}>
              {medicos.map((m) => <option key={m.id_medico} value={m.id_medico}>{nombreMedico(m)} — {m.especialidad}</option>)}
            </select>
          </label>
        )}
      </Encabezado>

      <div className="resumen">
        <div className="resumen__item"><span>Citas</span><strong>{citas?.length ?? '—'}</strong></div>
        <div className="resumen__item"><span>Por atender</span><strong>{cuenta(POR_ATENDER)}</strong></div>
        <div className="resumen__item"><span>En espera (triados)</span><strong>{cuenta(['triada'])}</strong></div>
        <div className="resumen__item"><span>Atendidos</span><strong>{cuenta(['atendida'])}</strong></div>
        <div className="resumen__item"><span>No asistieron</span><strong>{cuenta(['inasistente'])}</strong></div>
      </div>

      {esMedico && siguiente && (
        <div className="siguiente">
          <span className="siguiente__icono"><Icono nombre="reloj" tamano={22} /></span>
          <div className="siguiente__texto">
            <span className="texto-suave">Siguiente paciente</span>
            <strong>{horaCorta(siguiente.hora)} · {nombreCompleto(siguiente.paciente)}</strong>
          </div>
          <Link className="boton boton--con-icono" to={`/hce/${siguiente.id_paciente}`}>
            <Icono nombre="historia" /><span>Atender</span>
          </Link>
        </div>
      )}

      <div className="tarjeta tarjeta--tabla">
        {citas === null ? <p className="cargando">Cargando agenda…</p> : citas.length === 0 ? (
          <div className="vacio vacio--plano"><p>No hay citas para hoy.</p></div>
        ) : (
          <table className="tabla">
            <thead>
              <tr><th>Hora</th><th>Paciente</th><th>Estado</th>{esMedico && <><th>Triaje</th><th aria-label="Acciones" /></>}</tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id_cita} className={c.estado === 'inasistente' ? 'tabla__fila--apagada' : undefined}>
                  <td data-titulo="Hora"><strong>{horaCorta(c.hora)}</strong></td>
                  <td data-titulo="Paciente">
                    {nombreCompleto(c.paciente)}
                    <span className="tabla__sub">{edad(c.paciente.fecha_nacimiento)} años · {c.paciente.numero_hce}</span>
                  </td>
                  <td data-titulo="Estado"><EstadoCita estado={c.estado} /></td>
                  {esMedico && (
                  <td data-titulo="Triaje">
                    {c.triaje ? (
                      <span className="signos-linea">
                        PA {c.triaje.presion_sistolica}/{c.triaje.presion_diastolica} · FC {c.triaje.frecuencia_cardiaca} · T {Number(c.triaje.temperatura).toFixed(1)} °C
                      </span>
                    ) : <span className="texto-suave">—</span>}
                  </td>
                  )}
                  {esMedico && <td className="tabla__acciones">
                    {c.estado !== 'inasistente' && (
                      <Link className="boton-chico" to={`/hce/${c.id_paciente}`}>
                        <Icono nombre="historia" tamano={16} /><span>{c.estado === 'atendida' ? 'Ver HCE' : 'Abrir HCE'}</span>
                      </Link>
                    )}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
