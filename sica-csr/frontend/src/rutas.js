// Registro central de pantallas. Cada módulo declara las suyas en su archivo rutas.js;
// para un módulo nuevo (p. ej. m3_laboratorio) basta con importarlo y agregarlo aquí.
import rutasM1 from './modulos/m1_hce/rutas.js'
import rutasM2 from './modulos/m2_agenda/rutas.js'
import rutasAdministracion from './modulos/administracion/rutas.js'
import rutasM3 from './modulos/m3_laboratorio/rutas.js'
import rutasM4 from './modulos/m4_facturacion/rutas.js'
import rutasM5 from './modulos/m5_reportes/rutas.js'

export const RUTAS = [...rutasM1, ...rutasM2, ...rutasM3, ...rutasM4, ...rutasM5, ...rutasAdministracion]

// Título o descripción de una pantalla para el rol que inició sesión (p. ej. «Agenda por médico» en recepción)
export const tituloPara = (ruta, rol) => ruta.tituloPorRol?.[rol] ?? ruta.titulo
export const descripcionPara = (ruta, rol) => ruta.descripcionPorRol?.[rol] ?? ruta.descripcion
