// Título de cada pantalla con su descripción y, opcionalmente, botones a la derecha.
// Uso: <Encabezado titulo="Pacientes" descripcion="…"><button className="boton">Nuevo</button></Encabezado>
export default function Encabezado({ titulo, descripcion, children }) {
  return (
    <header className="encabezado">
      <div className="encabezado__textos">
        <h1>{titulo}</h1>
        {descripcion && <p className="texto-suave">{descripcion}</p>}
      </div>
      {children && <div className="encabezado__acciones">{children}</div>}
    </header>
  )
}
