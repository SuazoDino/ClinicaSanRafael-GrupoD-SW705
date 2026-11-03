// Pantallas del módulo M2 (mismo formato que m1_hce/rutas.js).
import AgendaCitas from './AgendaCitas/AgendaCitas.jsx'
import AgendaMedico from './AgendaMedico/AgendaMedico.jsx'

export default [
  { ruta: '/agenda', titulo: 'Agenda de citas', componente: AgendaCitas, roles: ['recepcionista'] },
  { ruta: '/mi-agenda', titulo: 'Mi agenda del día', componente: AgendaMedico, roles: ['medico'] },
]
