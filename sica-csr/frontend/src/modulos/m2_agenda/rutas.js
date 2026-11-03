// Pantallas del módulo M2 (mismo formato que m1_hce/rutas.js).
import AgendaCitas from './AgendaCitas/AgendaCitas.jsx'
import AgendaMedico from './AgendaMedico/AgendaMedico.jsx'

export default [
  { ruta: '/agenda', titulo: 'Agenda de citas', componente: AgendaCitas, roles: ['recepcionista'],
    icono: 'agenda', descripcion: 'Agenda, reprograma o cancela citas.' },
  { ruta: '/mi-agenda', titulo: 'Mi agenda del día', componente: AgendaMedico, roles: ['medico'],
    icono: 'miAgenda', descripcion: 'Tus pacientes de hoy, ordenados por hora.' },
]
