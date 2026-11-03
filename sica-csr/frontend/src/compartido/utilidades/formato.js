// Fechas y textos que se repiten en varias pantallas. Las fechas viajan como 'YYYY-MM-DD' (igual que la API).
const dos = (n) => String(n).padStart(2, '0')

export const aISO = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
export const deISO = (iso) => { const [a, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(a, m - 1, d) }
export const hoyISO = () => aISO(new Date())
// Fecha y hora local sin zona, como TIMESTAMP de PostgreSQL: '2026-11-03T08:20:00'
export const ahoraISO = () => { const d = new Date(); return `${aISO(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}` }
export const sumarDias = (iso, dias) => { const d = deISO(iso); d.setDate(d.getDate() + dias); return aISO(d) }
// 1 = lunes … 7 = domingo (igual que horario_medico.dia_semana)
export const diaSemana = (iso) => ((deISO(iso).getDay() + 6) % 7) + 1

export const horaCorta = (hora) => hora?.slice(0, 5) ?? ''
export const nombreCompleto = (p) => (p ? `${p.nombres} ${p.apellidos}` : '')
export const nombreMedico = (m) => (m ? `${m.nombres} ${m.apellidos}` : '')

export function edad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const nac = deISO(fechaNacimiento)
  const hoy = new Date()
  let anios = hoy.getFullYear() - nac.getFullYear()
  if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) anios -= 1
  return anios
}

const fmtCorta = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtLarga = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtDiaCorto = new Intl.DateTimeFormat('es-PE', { weekday: 'short' })
const fmtMesCorto = new Intl.DateTimeFormat('es-PE', { month: 'short' })
const fmtHora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const sinPunto = (t) => t.replace('.', '')

export const fechaCorta = (iso) => (iso ? fmtCorta.format(deISO(iso)) : '—')
export const fechaLarga = (iso) => capitalizar(fmtLarga.format(deISO(iso)))
// Para los botones de días: { dia: 'MAR', numero: 3, mes: 'NOV' }
export const partesDia = (iso) => {
  const d = deISO(iso)
  return { dia: sinPunto(fmtDiaCorto.format(d)), numero: d.getDate(), mes: sinPunto(fmtMesCorto.format(d)) }
}
// '2026-11-03T08:20:00' → '3 nov 2026 · 08:20'
export const fechaHora = (ts) => (ts ? `${fechaCorta(ts)} · ${fmtHora.format(new Date(ts))}` : '—')

export const ESTADOS_CITA = {
  registrada: 'Registrada',
  confirmada: 'Confirmada',
  triada: 'Triada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
  inasistente: 'No asistió',
}
