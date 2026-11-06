"""Citas: registrar sin cupos duplicados (HU02), reprogramar o cancelar (HU10) y marcar asistencia (HU07).

Acceso (ERS 3.5): "recepcionista".
"""
from datetime import date

from fastapi import APIRouter, status

from app.modulos.m2_agenda.esquemas.cita import CitaAsistencia, CitaCancelar, CitaCrear, CitaReprogramar, CitaSalida
from app.modulos.m2_agenda.servicios import asistencia_servicio, cita_servicio
from app.nucleo.dependencias import AuditorActual, Sesion, requiere_roles

router = APIRouter(prefix="/citas", tags=["M2 · Citas"], dependencies=[requiere_roles("recepcionista")])


@router.get("", response_model=list[CitaSalida])
def listar(
    db: Sesion,
    fecha: date | None = None,
    id_medico: int | None = None,
    id_especialidad: int | None = None,
    id_paciente: int | None = None,
):
    """Solo con `id_paciente`: próximas citas del paciente. Si no, citas filtradas por fecha, médico,
    especialidad y/o paciente (los filtros se combinan)."""
    if id_paciente is not None and fecha is None and id_medico is None and id_especialidad is None:
        return cita_servicio.proximas_del_paciente(db, id_paciente)
    return cita_servicio.listar(
        db, fecha=fecha, id_medico=id_medico, id_especialidad=id_especialidad, id_paciente=id_paciente
    )


@router.post(
    "",
    response_model=CitaSalida,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "El cupo ya está tomado o no es un horario válido"}},
)
def registrar(datos: CitaCrear, db: Sesion, auditor: AuditorActual):
    return cita_servicio.registrar(db, datos, auditor)


@router.put("/{id_cita}/reprogramar", response_model=CitaSalida)
def reprogramar(id_cita: int, datos: CitaReprogramar, db: Sesion, auditor: AuditorActual):
    return cita_servicio.reprogramar(db, id_cita, datos, auditor)


@router.put("/{id_cita}/cancelar", response_model=CitaSalida)
def cancelar(id_cita: int, datos: CitaCancelar, db: Sesion, auditor: AuditorActual):
    return cita_servicio.cancelar(db, id_cita, datos, auditor)


@router.put("/{id_cita}/asistencia", response_model=CitaSalida)
def asistencia(id_cita: int, datos: CitaAsistencia, db: Sesion, auditor: AuditorActual):
    return asistencia_servicio.marcar(db, id_cita, datos.asistio, auditor)
