// Marcador para pantallas que aún no se implementan (ver RegistroPaciente.jsx como ejemplo de pantalla terminada).
import Icono from './Icono.jsx'

export default function EnConstruccion({ titulo, historia }) {
  const historias = String(historia ?? '').split(',').map((h) => h.trim()).filter(Boolean)
  return (
    <section>
      <h1>{titulo}</h1>
      <div className="pendiente">
        <span className="pendiente__icono"><Icono nombre="herramienta" tamano={26} /></span>
        <div>
          <strong>Pantalla en desarrollo</strong>
          <p className="texto-suave">Esta sección se habilitará en este sprint.</p>
          {historias.length > 0 && (
            <ul className="pendiente__historias">
              {historias.map((h) => <li key={h}>{h}</li>)}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
