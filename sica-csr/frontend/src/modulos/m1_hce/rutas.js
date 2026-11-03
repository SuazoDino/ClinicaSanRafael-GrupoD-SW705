// Pantallas del módulo M1. Cada entrada genera la ruta y, si enMenu no es false, el enlace del menú.
//   ruta:       URL de la pantalla
//   titulo:     texto del menú
//   componente: pantalla (archivo .jsx)
//   roles:      roles con acceso (el administrador siempre entra)
import HistoriaClinica from './HistoriaClinica/HistoriaClinica.jsx'
import RegistroPaciente from './RegistroPaciente/RegistroPaciente.jsx'
import Triaje from './Triaje/Triaje.jsx'

export default [
  { ruta: '/pacientes', titulo: 'Registro de pacientes', componente: RegistroPaciente, roles: ['recepcionista'] },
  { ruta: '/triaje', titulo: 'Triaje', componente: Triaje, roles: ['enfermera'] },
  { ruta: '/hce/:idPaciente', titulo: 'Historia clínica', componente: HistoriaClinica, roles: ['medico'], enMenu: false },
]
