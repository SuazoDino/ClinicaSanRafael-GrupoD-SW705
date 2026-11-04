// Registro central de pantallas. Cada módulo declara las suyas en su archivo rutas.js;
// para un módulo nuevo (p. ej. m3_laboratorio) basta con importarlo y agregarlo aquí.
import rutasM1 from './modulos/m1_hce/rutas.js'
import rutasM2 from './modulos/m2_agenda/rutas.js'
import rutasAdministracion from './modulos/administracion/rutas.js'

export const RUTAS = [...rutasM1, ...rutasM2, ...rutasAdministracion]

// Título o descripción de una pantalla para el rol que inició sesión (p. ej. «Agenda por médico» en recepción)
export const tituloPara = (ruta, rol) => ruta.tituloPorRol?.[rol] ?? ruta.titulo
export const descripcionPara = (ruta, rol) => ruta.descripcionPorRol?.[rol] ?? ruta.descripcion
