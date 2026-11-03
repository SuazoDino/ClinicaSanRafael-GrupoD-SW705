// Pantallas de administración (mismo formato que m1_hce/rutas.js). Solo el administrador las ve.
//   seccion: título del grupo en el menú lateral (por defecto «Módulos»)
// PENDIENTE DE DECISIÓN: no está en el Sprint 1 ni en el 2 (ver comentario en api.js).
import Personal from './Personal/Personal.jsx'

export default [
  { ruta: '/personal', titulo: 'Personal asistencial', componente: Personal, roles: ['administrador'], seccion: 'Administración',
    icono: 'personal', descripcion: 'Médicos y enfermería: datos, horarios y acceso al sistema.' },
]
