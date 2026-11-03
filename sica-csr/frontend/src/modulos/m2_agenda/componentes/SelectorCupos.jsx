// Tira de días con atención + grilla de cupos del médico (HU01). La usan Nueva cita y Reprogramar.
import { useEffect, useState } from 'react'
import { horaCorta, hoyISO, partesDia } from '../../../compartido/utilidades/formato.js'
import { disponibilidadApi } from '../api.js'

const TEXTO_CUPO = { libre: 'Libre', ocupado: 'Ocupado', pasado: 'Pasó' }

export default function SelectorCupos({ idMedico, fecha, onFecha, hora, onHora, version = 0 }) {
  const [dias, setDias] = useState([])
  const [cupos, setCupos] = useState(null)

  useEffect(() => { disponibilidadApi.diasConAtencion(hoyISO(), 6).then(setDias) }, [])
  useEffect(() => {
    if (!idMedico) { setCupos(null); return }
    setCupos(null)
    disponibilidadApi.cupos({ idMedico, fecha }).then(setCupos)
  }, [idMedico, fecha, version])

  const libres = cupos?.filter((c) => c.estado === 'libre').length ?? 0

  return (
    <div className="selector-cupos">
      <div className="dias" role="radiogroup" aria-label="Fecha">
        {dias.map((d) => {
          const p = partesDia(d)
          return (
            <button key={d} type="button" role="radio" aria-checked={d === fecha}
              className={`dia${d === fecha ? ' dia--activo' : ''}`} onClick={() => onFecha(d)}>
              <span className="dia__semana">{p.dia}</span>
              <span className="dia__numero">{p.numero}</span>
              <span className="dia__mes">{p.mes}</span>
            </button>
          )
        })}
      </div>

      {!idMedico ? (
        <p className="texto-suave selector-cupos__aviso">Elige un médico para ver sus cupos.</p>
      ) : cupos === null ? (
        <p className="texto-suave selector-cupos__aviso">Cargando cupos…</p>
      ) : cupos.length === 0 ? (
        <p className="texto-suave selector-cupos__aviso">El médico no atiende este día.</p>
      ) : (
        <>
          <div className="cupos" role="radiogroup" aria-label="Horario">
            {cupos.map((c) => (
              <button key={c.hora} type="button" role="radio" aria-checked={c.hora === hora}
                disabled={c.estado !== 'libre'} onClick={() => onHora(c.hora)}
                className={`cupo cupo--${c.estado}${c.hora === hora ? ' cupo--elegido' : ''}`}>
                <strong>{horaCorta(c.hora)}</strong>
                <span>{c.hora === hora ? 'Elegido' : TEXTO_CUPO[c.estado]}</span>
              </button>
            ))}
          </div>
          <p className="leyenda">
            <span><i className="leyenda__punto leyenda__punto--libre" />Libre ({libres})</span>
            <span><i className="leyenda__punto leyenda__punto--elegido" />Elegido</span>
            <span><i className="leyenda__punto leyenda__punto--ocupado" />Ocupado</span>
          </p>
        </>
      )}
    </div>
  )
}
