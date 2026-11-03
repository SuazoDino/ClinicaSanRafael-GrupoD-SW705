// Ventana sobre la pantalla para formularios cortos (editar, cancelar, anular…).
// Uso: <Modal titulo="Cancelar cita" onCerrar={...} pie={<botones/>}>contenido</Modal>
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icono from './Icono.jsx'

export default function Modal({ titulo, subtitulo, children, pie, onCerrar, ancho = 'normal' }) {
  const caja = useRef(null)
  const cerrar = useRef(onCerrar)
  cerrar.current = onCerrar

  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && cerrar.current()
    window.addEventListener('keydown', alPresionar)
    document.body.classList.add('sin-scroll')
    caja.current?.querySelector('input, textarea, select')?.focus()
    return () => {
      window.removeEventListener('keydown', alPresionar)
      document.body.classList.remove('sin-scroll')
    }
  }, [])

  return createPortal(
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={caja} className={`modal__caja modal__caja--${ancho}`} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <header className="modal__cabeza">
          <div>
            <h2 id="modal-titulo">{titulo}</h2>
            {subtitulo && <p className="texto-suave">{subtitulo}</p>}
          </div>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <div className="modal__cuerpo">{children}</div>
        {pie && <footer className="modal__pie">{pie}</footer>}
      </div>
    </div>,
    document.body,
  )
}
