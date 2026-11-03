import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './compartido/autenticacion/Login.jsx'
import RutaProtegida from './compartido/autenticacion/RutaProtegida.jsx'
import Inicio from './compartido/componentes/Inicio.jsx'
import Layout from './compartido/layout/Layout.jsx'
import { RUTAS } from './rutas.js'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        {RUTAS.map(({ ruta, componente: Pantalla, roles }) => (
          <Route key={ruta} path={ruta} element={<RutaProtegida roles={roles}><Pantalla /></RutaProtegida>} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
