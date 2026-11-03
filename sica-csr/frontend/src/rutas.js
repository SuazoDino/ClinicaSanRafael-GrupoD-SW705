// Registro central de pantallas. Cada módulo declara las suyas en su archivo rutas.js;
// para un módulo nuevo (p. ej. m3_laboratorio) basta con importarlo y agregarlo aquí.
import rutasM1 from './modulos/m1_hce/rutas.js'
import rutasM2 from './modulos/m2_agenda/rutas.js'

export const RUTAS = [...rutasM1, ...rutasM2]
