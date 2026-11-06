// Marcador para las pantallas de los módulos del Sprint 2 (M3, M4 y M5): solo muestra el aviso.
import Icono from './Icono.jsx'

export default function EnConstruccion({ titulo }) {
  return (
    <section>
      <h1>{titulo}</h1>
      <div className="pendiente">
        <span className="pendiente__icono"><Icono nombre="herramienta" tamano={26} /></span>
        <div>
          <strong>Página próximamente en el Sprint 2</strong>
        </div>
      </div>
    </section>
  )
}
