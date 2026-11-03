// Logotipo de la clínica: isotipo + "CLÍNICA / San Rafael / — CUIDADO QUE SANA".
// Se reutiliza en el login y el menú lateral.
// variante="clara" para fondos oscuros (menú), "oscura" para fondos claros.
import isotipo from '../../assets/isotipo-clinica-san-rafael.png'

export default function Marca({ variante = 'oscura', tamano = 'normal', lema = 'Cuidado que sana' }) {
  return (
    <span className={`marca marca--${variante} marca--${tamano}`} aria-label="Clínica San Rafael">
      <span className="marca__logo">
        <img src={isotipo} alt="" />
      </span>
      <span className="marca__texto" aria-hidden="true">
        <span className="marca__clinica">Clínica</span>
        <span className="marca__nombre">San Rafael</span>
        {lema && <span className="marca__lema">{lema}</span>}
      </span>
    </span>
  )
}
