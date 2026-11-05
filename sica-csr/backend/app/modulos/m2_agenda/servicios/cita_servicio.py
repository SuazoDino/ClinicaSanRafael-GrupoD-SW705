"""Registrar cita (la BD rechaza cupos duplicados con ux_cita_cupo → 409), reprogramar y cancelar liberando el cupo
(HU02, HU10). Al crear o reprogramar una cita se programa su recordatorio 24 h antes (HU09).

También expone a M1 `cambiar_estado`, `obtener` y `citas_del_paciente`: M1 no toca la tabla cita directamente.
"""
from collections.abc import Sequence
from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modulos.m1_hce.servicios import resumen_servicio
from app.modulos.m2_agenda.esquemas.cita import CitaCancelar, CitaConMedico, CitaCrear, CitaReprogramar, CitaSalida
from app.modulos.m2_agenda.esquemas.recordatorio import RecordatorioSalida
from app.modulos.m2_agenda.modelos import Cita, Recordatorio
from app.modulos.m2_agenda.servicios import disponibilidad_servicio
from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.autenticacion.modelos import Usuario
from app.nucleo.excepciones import Conflicto, DatosInvalidos, NoEncontrado, Prohibido
from app.nucleo.tiempo import hoy

MODIFICABLES = ("registrada", "confirmada")  # estados en los que aún se puede reprogramar o cancelar
ANTICIPACION_RECORDATORIO = timedelta(hours=24)
CANAL_RECORDATORIO = "whatsapp"


# ---------- Salida ----------

def a_salida(db: Session, citas: Sequence[Cita]) -> list[CitaSalida]:
    """Arma CitaSalida para varias citas con una consulta por tabla (no una por cita)."""
    if not citas:
        return []
    ids = [c.id_cita for c in citas]
    pacientes = resumen_servicio.pacientes_por_id(db, {c.id_paciente for c in citas})
    medicos = disponibilidad_servicio.medicos_por_id(db, {c.id_medico for c in citas})
    triajes = resumen_servicio.triajes_por_cita(db, ids)
    recordatorios: dict[int, Recordatorio] = {}
    for r in db.scalars(select(Recordatorio).where(Recordatorio.id_cita.in_(ids)).order_by(Recordatorio.id_recordatorio)):
        recordatorios[r.id_cita] = r  # queda el último
    return [
        CitaSalida(
            **_datos_cita(c),
            medico=medicos[c.id_medico],
            paciente=pacientes[c.id_paciente],
            recordatorio=RecordatorioSalida.model_validate(recordatorios[c.id_cita]) if c.id_cita in recordatorios else None,
            triaje=triajes.get(c.id_cita),
        )
        for c in citas
    ]


def _datos_cita(cita: Cita) -> dict:
    return {
        "id_cita": cita.id_cita, "id_paciente": cita.id_paciente, "id_medico": cita.id_medico,
        "fecha": cita.fecha, "hora": cita.hora, "estado": cita.estado, "motivo_cancelacion": cita.motivo_cancelacion,
    }


def una_salida(db: Session, cita: Cita) -> CitaSalida:
    return a_salida(db, [cita])[0]


# ---------- Lecturas ----------

def obtener(db: Session, id_cita: int) -> Cita:
    cita = db.get(Cita, id_cita)
    if cita is None:
        raise NoEncontrado("Cita no encontrada")
    return cita


def listar(
    db: Session,
    fecha: date | None = None,
    id_medico: int | None = None,
    estados: Sequence[str] | None = None,
    sin_canceladas: bool = False,
) -> list[CitaSalida]:
    """Citas filtradas, ordenadas por hora y luego por médico."""
    consulta = select(Cita).order_by(Cita.hora, Cita.id_medico)
    if fecha is not None:
        consulta = consulta.where(Cita.fecha == fecha)
    if id_medico is not None:
        consulta = consulta.where(Cita.id_medico == id_medico)
    if estados:
        consulta = consulta.where(Cita.estado.in_(estados))
    if sin_canceladas:
        consulta = consulta.where(Cita.estado != "cancelada")
    return a_salida(db, db.scalars(consulta).all())


def proximas_del_paciente(db: Session, id_paciente: int) -> list[CitaSalida]:
    consulta = (
        select(Cita)
        .where(Cita.id_paciente == id_paciente, Cita.fecha >= hoy())
        .order_by(Cita.fecha, Cita.hora)
    )
    return a_salida(db, db.scalars(consulta).all())


def citas_del_paciente(db: Session, id_paciente: int) -> list[Cita]:
    """Todas las citas del paciente (para la HCE de M1)."""
    return list(db.scalars(select(Cita).where(Cita.id_paciente == id_paciente)))


def con_medico(db: Session, citas: Sequence[Cita]) -> list[CitaConMedico]:
    medicos = disponibilidad_servicio.medicos_por_id(db, {c.id_medico for c in citas})
    return [CitaConMedico(**_datos_cita(c), medico=medicos[c.id_medico]) for c in citas]


# ---------- Escrituras ----------

def _verificar_cupo(db: Session, id_medico: int, fecha: date, hora: time, ignorar_cita: int | None = None) -> None:
    cupo = next((c for c in disponibilidad_servicio.cupos(db, id_medico, fecha, ignorar_cita) if c.hora == hora), None)
    if cupo is None:
        raise Conflicto("El médico no atiende en ese horario. Elige un cupo de la lista.")
    if cupo.estado == "pasado":
        raise Conflicto("Ese horario ya pasó. Elige otro cupo.")
    if cupo.estado == "ocupado":
        raise Conflicto("Ese cupo acaba de ser tomado. Elige otro horario.")


def _guardar_cupo(db: Session, cita: Cita) -> None:
    """Escribe la cita. Si otra petición tomó el cupo al mismo tiempo, el índice ux_cita_cupo lo impide."""
    try:
        with db.begin_nested():
            db.add(cita)
            db.flush()
    except IntegrityError as error:
        if "ux_cita_cupo" in str(error.orig):
            raise Conflicto("Ese cupo acaba de ser tomado. Elige otro horario.") from None
        raise


def _programar_recordatorio(db: Session, cita: Cita) -> None:
    db.add(
        Recordatorio(
            id_cita=cita.id_cita,
            canal=CANAL_RECORDATORIO,
            fecha_programada=datetime.combine(cita.fecha, cita.hora) - ANTICIPACION_RECORDATORIO,
            estado="pendiente",
        )
    )


def registrar(db: Session, datos: CitaCrear, auditor: Auditor) -> CitaSalida:
    if not resumen_servicio.existe_paciente(db, datos.id_paciente):
        raise NoEncontrado("Paciente no encontrado")
    _verificar_cupo(db, datos.id_medico, datos.fecha, datos.hora)

    cita = Cita(**datos.model_dump(), estado="registrada")
    _guardar_cupo(db, cita)
    _programar_recordatorio(db, cita)
    auditor.registrar("CREAR", "cita", cita.id_cita, f"{cita.fecha} {cita.hora:%H:%M} médico {cita.id_medico}")
    db.commit()
    return una_salida(db, cita)


def reprogramar(db: Session, id_cita: int, datos: CitaReprogramar, auditor: Auditor) -> CitaSalida:
    cita = obtener(db, id_cita)
    if cita.estado not in MODIFICABLES:
        raise Conflicto("Solo se reprograman citas que aún no se atienden.")
    _verificar_cupo(db, cita.id_medico, datos.fecha, datos.hora, ignorar_cita=cita.id_cita)

    anterior = f"{cita.fecha} {cita.hora:%H:%M}"
    cita.fecha, cita.hora, cita.estado = datos.fecha, datos.hora, "registrada"
    _guardar_cupo(db, cita)
    _programar_recordatorio(db, cita)
    auditor.registrar("REPROGRAMAR", "cita", cita.id_cita, f"{anterior} → {cita.fecha} {cita.hora:%H:%M}")
    db.commit()
    return una_salida(db, cita)


def cancelar(db: Session, id_cita: int, datos: CitaCancelar, auditor: Auditor) -> CitaSalida:
    cita = obtener(db, id_cita)
    if cita.estado not in MODIFICABLES:
        raise Conflicto("Esta cita ya no se puede cancelar.")
    cita.estado, cita.motivo_cancelacion = "cancelada", datos.motivo
    auditor.registrar("CANCELAR", "cita", cita.id_cita, datos.motivo)
    db.commit()
    return una_salida(db, cita)


def cambiar_estado(db: Session, id_cita: int, desde: str | Sequence[str], hacia: str) -> Cita:
    """Para M1 (triaje, consulta). No hace commit: lo hace el servicio que llama, junto con su propio registro."""
    desde = (desde,) if isinstance(desde, str) else tuple(desde)
    cita = obtener(db, id_cita)
    if cita.estado not in desde:
        raise Conflicto(f"La cita está «{cita.estado}» y no puede pasar a «{hacia}».")
    cita.estado = hacia
    db.flush()
    return cita


def agenda_medico(db: Session, usuario: Usuario, fecha: date, id_medico: int | None) -> list[CitaSalida]:
    """HU08 · Un médico ve solo su agenda; recepción indica de qué médico (ERS 3.5)."""
    if usuario.rol.nombre == "medico":
        propio = disponibilidad_servicio.id_medico_de_usuario(db, usuario.id_usuario)
        if propio is None:
            raise Prohibido("Su usuario no está vinculado a un médico.")
        if id_medico is not None and id_medico != propio:
            raise Prohibido("Solo puede ver su propia agenda.")
        id_medico = propio
    elif id_medico is None:
        raise DatosInvalidos("Indica el médico cuya agenda quieres ver.")
    else:
        disponibilidad_servicio.obtener_medico(db, id_medico)
    return listar(db, fecha=fecha, id_medico=id_medico, sin_canceladas=True)
