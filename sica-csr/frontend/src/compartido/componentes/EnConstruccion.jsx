// Marcador para pantallas que aún no se implementan.
export default function EnConstruccion({ titulo, historia }) {
  return (
    <section>
      <h1>{titulo}</h1>
      <p className="alerta">Pantalla pendiente ({historia}). Ver RegistroPaciente.jsx como ejemplo.</p>
    </section>
  )
}
