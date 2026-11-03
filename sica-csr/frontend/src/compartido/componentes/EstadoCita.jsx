// Etiqueta de color con el estado de una cita (valores de cita.estado en la BD)
import { ESTADOS_CITA } from '../utilidades/formato.js'

export default function EstadoCita({ estado }) {
  return <span className={`estado estado--${estado}`}>{ESTADOS_CITA[estado] ?? estado}</span>
}
