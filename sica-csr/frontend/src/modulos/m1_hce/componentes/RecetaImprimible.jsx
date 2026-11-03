// HU06 · Receta lista para imprimir. Se dibuja fuera de la app y solo se ve al imprimir (ver .impresion en index.css).
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Marca from '../../../compartido/componentes/Marca.jsx'
import { edad, fechaCorta, nombreCompleto, nombreMedico } from '../../../compartido/utilidades/formato.js'

export default function RecetaImprimible({ receta, paciente, onTerminar }) {
  const { consulta } = receta
  const principal = consulta.diagnosticos?.find((d) => d.es_principal) ?? consulta.diagnosticos?.[0]

  const alTerminar = useRef(onTerminar)
  alTerminar.current = onTerminar

  // Imprime una sola vez al aparecer y se retira al cerrar el diálogo de impresión
  useEffect(() => {
    const terminar = () => alTerminar.current()
    window.addEventListener('afterprint', terminar)
    const t = setTimeout(() => window.print(), 50)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', terminar) }
  }, [])

  return createPortal(
    <div className="impresion">
      <article className="receta">
        <header className="receta__cabeza">
          <Marca variante="oscura" />
          <div className="receta__titulo">
            <strong>Receta médica</strong>
            <span>N.° {String(consulta.id_consulta).padStart(6, '0')}</span>
            <span>{fechaCorta(receta.fecha_emision)}</span>
          </div>
        </header>
        <dl className="receta__datos">
          <div><dt>Paciente</dt><dd>{nombreCompleto(paciente)}</dd></div>
          <div><dt>DNI</dt><dd>{paciente.dni}</dd></div>
          <div><dt>Edad</dt><dd>{edad(paciente.fecha_nacimiento)} años</dd></div>
          <div><dt>N.° HCE</dt><dd>{paciente.numero_hce}</dd></div>
          {principal && <div className="receta__ancho"><dt>Diagnóstico</dt><dd>{principal.codigo_cie10} · {principal.descripcion}</dd></div>}
        </dl>
        <section className="receta__cuerpo">
          <h3>Rp.</h3>
          <p>{receta.indicaciones}</p>
        </section>
        <footer className="receta__firma">
          <span className="receta__linea" />
          <strong>{nombreMedico(consulta.medico)}</strong>
          <span>{consulta.medico?.especialidad} · CMP {consulta.medico?.colegiatura?.replace('CMP', '')}</span>
        </footer>
        <p className="receta__pie">Clínica San Rafael · Documento generado por SICA-CSR</p>
      </article>
    </div>,
    document.body,
  )
}
