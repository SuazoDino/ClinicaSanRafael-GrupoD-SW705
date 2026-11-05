// HU11 · Registrar triaje y signos vitales; la cita pasa de «confirmada» a «triada».
// Solo la enfermera registra; el administrador consulta en solo lectura (ERS 3.5).
import { useEffect, useState } from 'react'
import { mensajeError } from '../../../compartido/api/clienteHttp.js'
import { useSesion } from '../../../compartido/autenticacion/ContextoSesion.jsx'
import Encabezado from '../../../compartido/componentes/Encabezado.jsx'
import EstadoCita from '../../../compartido/componentes/EstadoCita.jsx'
import Icono from '../../../compartido/componentes/Icono.jsx'
import { edad, fechaHora, horaCorta, nombreCompleto, nombreMedico } from '../../../compartido/utilidades/formato.js'
import { RANGOS_TRIAJE, triajeApi } from '../api.js'
import SignosVitales, { calcularImc } from '../componentes/SignosVitales.jsx'

const CAMPOS = [
  { campo: 'presion_sistolica', etiqueta: 'Presión sistólica', unidad: 'mmHg', paso: 1 },
  { campo: 'presion_diastolica', etiqueta: 'Presión diastólica', unidad: 'mmHg', paso: 1 },
  { campo: 'frecuencia_cardiaca', etiqueta: 'Frecuencia cardiaca', unidad: 'lpm', paso: 1 },
  { campo: 'temperatura', etiqueta: 'Temperatura', unidad: '°C', paso: 0.1 },
  { campo: 'peso_kg', etiqueta: 'Peso', unidad: 'kg', paso: 0.1 },
  { campo: 'talla_cm', etiqueta: 'Talla', unidad: 'cm', paso: 0.1 },
]
const VACIO = Object.fromEntries(CAMPOS.map((c) => [c.campo, '']))

const textoImc = (imc) => (imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad')

// Avisos orientativos para que la enfermera revise el valor (no bloquean el registro)
function avisos(s) {
  const lista = []
  if (s.presion_sistolica >= 140 || s.presion_diastolica >= 90) lista.push('Presión arterial elevada')
  if (s.temperatura >= 38) lista.push('Fiebre')
  if (s.frecuencia_cardiaca > 100) lista.push('Taquicardia')
  if (s.frecuencia_cardiaca && s.frecuencia_cardiaca < 50) lista.push('Bradicardia')
  return lista
}

export default function Triaje() {
  const { usuario } = useSesion()
  const puedeRegistrar = usuario.rol === 'enfermera'
  const [citas, setCitas] = useState(null)
  const [idCita, setIdCita] = useState(null)
  const [signos, setSignos] = useState(VACIO)
  const [mensaje, setMensaje] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = () => triajeApi.delDia().then((lista) => {
    setCitas(lista)
    setIdCita((actual) => actual ?? lista.find((c) => c.estado === 'confirmada')?.id_cita ?? lista[0]?.id_cita ?? null)
  })
  useEffect(() => { cargar() }, [])

  const cita = citas?.find((c) => c.id_cita === idCita)
  const pendientes = citas?.filter((c) => c.estado === 'confirmada').length ?? 0

  function elegir(c) {
    setIdCita(c.id_cita)
    setSignos(VACIO)
    setMensaje(null)
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje(null)
    setOcupado(true)
    try {
      await triajeApi.registrar({ ...signos, id_cita: cita.id_cita })
      setMensaje({ tipo: 'exito', texto: `Triaje de ${nombreCompleto(cita.paciente)} registrado. Ya aparece en la HCE para el médico.` })
      setSignos(VACIO)
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setOcupado(false)
    }
  }

  const numeros = Object.fromEntries(Object.entries(signos).map(([k, v]) => [k, v === '' ? null : Number(v)]))
  const imc = calcularImc(numeros.peso_kg, numeros.talla_cm)
  const alertas = avisos(numeros)

  return (
    <section>
      <Encabezado titulo="Triaje y signos vitales"
        descripcion={puedeRegistrar
          ? 'Registra los signos antes de la consulta; el médico los verá sin volver a tomarlos.'
          : 'Triajes del día registrados por enfermería (solo lectura).'} />

      <div className="dos-columnas dos-columnas--lista">
        <aside className="tarjeta">
          <div className="tarjeta__cabeza">
            <h2>Pacientes de hoy</h2>
            <span className="texto-suave">{pendientes} por triar</span>
          </div>
          {citas === null && <p className="texto-suave">Cargando…</p>}
          {citas?.length === 0 && (
            <p className="texto-suave">Aún no llega ningún paciente. Recepción marca la asistencia en Agenda de citas.</p>
          )}
          <ul className="lista-seleccion">
            {citas?.map((c) => (
              <li key={c.id_cita}>
                <button type="button" onClick={() => elegir(c)}
                  className={`lista-seleccion__item${c.id_cita === idCita ? ' lista-seleccion__item--activo' : ''}`}>
                  <span className="lista-seleccion__texto">
                    <strong>{horaCorta(c.hora)} · {nombreCompleto(c.paciente)}</strong>
                    <span className="texto-suave">{nombreMedico(c.medico)} · {c.medico.especialidad}</span>
                  </span>
                  <EstadoCita estado={c.estado} />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="tarjeta">
          {!cita ? (
            <div className="vacio vacio--plano"><p>Elige un paciente de la lista.</p></div>
          ) : (
            <>
              <div className="ficha">
                <span className="avatar-texto avatar-texto--grande">{cita.paciente.nombres.charAt(0)}{cita.paciente.apellidos.charAt(0)}</span>
                <div>
                  <h2>{nombreCompleto(cita.paciente)}</h2>
                  <p className="texto-suave">
                    {edad(cita.paciente.fecha_nacimiento)} años · {cita.paciente.numero_hce} · cita de las {horaCorta(cita.hora)} con {nombreMedico(cita.medico)}
                  </p>
                </div>
              </div>

              {mensaje && <p className={`alerta alerta--${mensaje.tipo}`}>{mensaje.texto}</p>}

              {cita.triaje ? (
                <>
                  <SignosVitales triaje={cita.triaje} />
                  <p className="nota"><Icono nombre="check" tamano={16} />Triaje registrado el {fechaHora(cita.triaje.fecha_registro)}. Ya no se modifica.</p>
                </>
              ) : !puedeRegistrar ? (
                <p className="nota"><Icono nombre="reloj" tamano={16} />Pendiente de triaje: lo registra enfermería.</p>
              ) : (
                <form className="formulario formulario--triaje" onSubmit={guardar}>
                  {CAMPOS.map(({ campo, etiqueta, unidad, paso }) => (
                    <label key={campo}>{etiqueta}
                      <span className="campo-unidad">
                        <input type="number" inputMode="decimal" step={paso} min={RANGOS_TRIAJE[campo][0]} max={RANGOS_TRIAJE[campo][1]}
                          value={signos[campo]} onChange={(e) => setSignos({ ...signos, [campo]: e.target.value })} required />
                        <span>{unidad}</span>
                      </span>
                    </label>
                  ))}
                  <div className="ancho-completo resumen-triaje">
                    <span>IMC: <strong>{imc ? `${imc.toFixed(1)} · ${textoImc(imc)}` : '—'}</strong></span>
                    {alertas.map((a) => <span key={a} className="aviso-clinico"><Icono nombre="alerta" tamano={14} />{a}</span>)}
                  </div>
                  <div className="ancho-completo">
                    <button className="boton" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar triaje'}</button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
