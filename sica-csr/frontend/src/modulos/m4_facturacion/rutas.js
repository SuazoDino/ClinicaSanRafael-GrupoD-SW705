// Pantallas del módulo M4 (mismo formato que m1_hce/rutas.js). Se implementan en el Sprint 2.
import Facturacion from './Facturacion/Facturacion.jsx'

export default [
  { ruta: '/facturacion', titulo: 'Facturación y convenios', componente: Facturacion, roles: ['recepcionista', 'administrador'], seccion: 'Sprint 2',
    icono: 'facturacion', descripcion: 'Comprobantes, convenios (particular, EPS, SOAT) y copagos.' },
]
