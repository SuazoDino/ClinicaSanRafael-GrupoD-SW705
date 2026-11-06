// Pantallas del módulo M5 (mismo formato que m1_hce/rutas.js). Se implementan en el Sprint 2.
import Reportes from './Reportes/Reportes.jsx'

export default [
  { ruta: '/reportes', titulo: 'Reportes gerenciales', componente: Reportes, roles: ['administrador'], seccion: 'Sprint 2',
    icono: 'reportes', descripcion: 'Ocupación, tiempos de espera, ingresos e inasistencia.' },
]
