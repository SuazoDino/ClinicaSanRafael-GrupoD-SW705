// Pantallas del módulo M2 (mismo formato que m1_hce/rutas.js).
import AgendaCitas from './AgendaCitas/AgendaCitas.jsx'
import AgendaMedico from './AgendaMedico/AgendaMedico.jsx'

export default [
  { ruta: '/agenda', titulo: 'Agenda de citas', componente: AgendaCitas, roles: ['recepcionista'],
    icono: 'agenda', descripcion: 'Agenda, reprograma o cancela citas.' },
  { ruta: '/mi-agenda', titulo: 'Mi agenda del día', componente: AgendaMedico, roles: ['medico', 'recepcionista'],
    icono: 'miAgenda', descripcion: 'Tus pacientes de hoy, ordenados por hora.',
    tituloPorRol: { recepcionista: 'Agenda por médico' },
    descripcionPorRol: { recepcionista: 'Las citas del día de cada médico y su estado.' } },
]
