// Pantallas del módulo M1. Cada entrada genera la ruta y, si enMenu no es false, el enlace del menú.
//   ruta:       URL de la pantalla
//   titulo:     texto del menú
//   componente: pantalla (archivo .jsx)
//   roles:      roles con acceso (el administrador siempre entra)
//   icono:      nombre del ícono (ver compartido/componentes/Icono.jsx)
//   descripcion: texto corto que aparece en la tarjeta de Inicio
import HistoriaClinica from './HistoriaClinica/HistoriaClinica.jsx'
import RegistroPaciente from './RegistroPaciente/RegistroPaciente.jsx'
import Triaje from './Triaje/Triaje.jsx'

export default [
  { ruta: '/pacientes', titulo: 'Pacientes', componente: RegistroPaciente, roles: ['recepcionista'],
    icono: 'pacientes', descripcion: 'Busca, registra y actualiza los datos de los pacientes.' },
  { ruta: '/triaje', titulo: 'Triaje', componente: Triaje, roles: ['enfermera'],
    icono: 'triaje', descripcion: 'Registra signos vitales antes de la consulta.' },
  { ruta: '/hce', titulo: 'Historia clínica', componente: HistoriaClinica, roles: ['medico'],
    icono: 'historia', descripcion: 'Antecedentes, triaje, consultas con CIE-10 y recetas.' },
  { ruta: '/hce/:idPaciente', titulo: 'Historia clínica', componente: HistoriaClinica, roles: ['medico'], enMenu: false,
    icono: 'historia' },
]
