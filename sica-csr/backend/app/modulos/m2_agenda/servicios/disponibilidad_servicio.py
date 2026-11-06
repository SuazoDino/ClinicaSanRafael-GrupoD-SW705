"""Calcula los cupos a partir de horario_medico y descuenta las citas no canceladas (HU01).
También ofrece las listas de especialidades y médicos."""
from collections.abc import Iterable
from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modulos.m2_agenda.esquemas.disponibilidad import CupoSalida
from app.modulos.m2_agenda.esquemas.medico import EspecialidadSalida, MedicoSalida
from app.modulos.m2_agenda.modelos import Cita, Especialidad, HorarioMedico, Medico
from app.nucleo.excepciones import NoEncontrado
from app.nucleo.tiempo import ahora

MAX_DIAS_BUSQUEDA = 30


def a_salida_medico(medico: Medico) -> MedicoSalida:
    return MedicoSalida(
        id_medico=medico.id_medico, nombres=medico.nombres, apellidos=medico.apellidos,
        colegiatura=medico.colegiatura, id_especialidad=medico.id_especialidad,
        especialidad=medico.especialidad.nombre,
    )


def especialidades(db: Session) -> list[EspecialidadSalida]:
    return [EspecialidadSalida.model_validate(e) for e in db.scalars(select(Especialidad).order_by(Especialidad.nombre))]


def medicos(db: Session, id_especialidad: int | None = None) -> list[MedicoSalida]:
    consulta = select(Medico).order_by(Medico.apellidos, Medico.nombres)
    if id_especialidad is not None:
        consulta = consulta.where(Medico.id_especialidad == id_especialidad)
    return [a_salida_medico(m) for m in db.scalars(consulta)]


def medicos_por_id(db: Session, ids: Iterable[int]) -> dict[int, MedicoSalida]:
    ids = set(ids)
    if not ids:
        return {}
    return {m.id_medico: a_salida_medico(m) for m in db.scalars(select(Medico).where(Medico.id_medico.in_(ids)))}


def obtener_medico(db: Session, id_medico: int) -> Medico:
    medico = db.get(Medico, id_medico)
    if medico is None:
        raise NoEncontrado("Médico no encontrado")
    return medico


def id_medico_de_usuario(db: Session, id_usuario: int) -> int | None:
    return db.scalar(select(Medico.id_medico).where(Medico.id_usuario == id_usuario))


def _horas_del_horario(horario: HorarioMedico) -> list[time]:
    paso = timedelta(minutes=horario.duracion_cupo_min)
    inicio = datetime.combine(date.min, horario.hora_inicio)
    fin = datetime.combine(date.min, horario.hora_fin)
    horas = []
    while inicio + paso <= fin:
        horas.append(inicio.time())
        inicio += paso
    return horas


def cupos(db: Session, id_medico: int, fecha: date, ignorar_cita: int | None = None) -> list[CupoSalida]:
    """Cupos del médico en la fecha. `ignorar_cita` permite reprogramar una cita a su propio cupo."""
    obtener_medico(db, id_medico)
    horarios = db.scalars(
        select(HorarioMedico)
        .where(HorarioMedico.id_medico == id_medico, HorarioMedico.dia_semana == fecha.isoweekday())
        .order_by(HorarioMedico.hora_inicio)
    )
    consulta_ocupadas = select(Cita.hora).where(Cita.id_medico == id_medico, Cita.fecha == fecha, Cita.estado != "cancelada")
    if ignorar_cita is not None:
        consulta_ocupadas = consulta_ocupadas.where(Cita.id_cita != ignorar_cita)
    ocupadas = set(db.scalars(consulta_ocupadas))
    momento_actual = ahora()

    resultado = []
    for horario in horarios:
        for hora in _horas_del_horario(horario):
            if hora in ocupadas:
                estado = "ocupado"
            elif datetime.combine(fecha, hora) <= momento_actual:
                estado = "pasado"
            else:
                estado = "libre"
            resultado.append(CupoSalida(hora=hora, estado=estado))
    return resultado


def dias_con_atencion(
    db: Session,
    desde: date,
    cantidad: int,
    id_medico: int | None = None,
    id_especialidad: int | None = None,
) -> list[date]:
    """Próximos días (hasta 30 a partir de `desde`) en los que atiende el médico, algún médico de la
    especialidad o, sin filtros, algún médico."""
    consulta = select(HorarioMedico.dia_semana).distinct()
    if id_medico is not None:
        consulta = consulta.where(HorarioMedico.id_medico == id_medico)
    if id_especialidad is not None:
        consulta = consulta.join(Medico, Medico.id_medico == HorarioMedico.id_medico).where(
            Medico.id_especialidad == id_especialidad
        )
    dias_semana = set(db.scalars(consulta))
    dias = []
    for d in range(MAX_DIAS_BUSQUEDA):
        fecha = desde + timedelta(days=d)
        if fecha.isoweekday() in dias_semana:
            dias.append(fecha)
            if len(dias) == cantidad:
                break
    return dias
