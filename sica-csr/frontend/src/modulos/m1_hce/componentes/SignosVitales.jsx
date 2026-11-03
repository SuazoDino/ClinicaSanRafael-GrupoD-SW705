// Tarjetas con los signos vitales de un triaje. Se usa en Triaje, HCE y Mi agenda.
export const calcularImc = (peso, talla) => (peso > 0 && talla > 0 ? peso / (talla / 100) ** 2 : null)

export default function SignosVitales({ triaje }) {
  const imc = calcularImc(Number(triaje.peso_kg), Number(triaje.talla_cm))
  const items = [
    ['Presión', `${triaje.presion_sistolica}/${triaje.presion_diastolica}`, 'mmHg'],
    ['Frec. cardiaca', triaje.frecuencia_cardiaca, 'lpm'],
    ['Temperatura', Number(triaje.temperatura).toFixed(1), '°C'],
    ['Peso', triaje.peso_kg, 'kg'],
    ['Talla', triaje.talla_cm, 'cm'],
    ['IMC', imc ? imc.toFixed(1) : '—', ''],
  ]
  return (
    <dl className="signos">
      {items.map(([etiqueta, valor, unidad]) => (
        <div key={etiqueta} className="signo">
          <dt>{etiqueta}</dt>
          <dd><strong>{valor}</strong> {unidad && <span>{unidad}</span>}</dd>
        </div>
      ))}
    </dl>
  )
}
