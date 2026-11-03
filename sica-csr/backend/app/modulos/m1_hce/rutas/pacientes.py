"""Endpoints de pacientes (HU03 · RF01)."""
from fastapi import APIRouter, Query, status

from app.modulos.m1_hce.esquemas.paciente import PacienteActualizar, PacienteCrear, PacienteSalida
from app.modulos.m1_hce.servicios import paciente_servicio
from app.nucleo.dependencias import AuditorActual, Sesion, requiere_roles

router = APIRouter(prefix="/pacientes", tags=["M1 · Pacientes"])

PERSONAL_CLINICO = ("recepcionista", "enfermera", "medico")


@router.get("", response_model=list[PacienteSalida], dependencies=[requiere_roles(*PERSONAL_CLINICO)])
def buscar(db: Sesion, texto: str = Query(min_length=2, description="DNI o parte del nombre/apellido")):
    return paciente_servicio.buscar(db, texto)


@router.get("/{id_paciente}", response_model=PacienteSalida, dependencies=[requiere_roles(*PERSONAL_CLINICO)])
def obtener(id_paciente: int, db: Sesion, auditor: AuditorActual):
    return paciente_servicio.obtener(db, id_paciente, auditor)


@router.post(
    "",
    response_model=PacienteSalida,
    status_code=status.HTTP_201_CREATED,
    dependencies=[requiere_roles("recepcionista")],
    responses={409: {"description": "El DNI ya está registrado; incluye id_paciente del existente"}},
)
def registrar(datos: PacienteCrear, db: Sesion, auditor: AuditorActual):
    return paciente_servicio.registrar(db, datos, auditor)


@router.put("/{id_paciente}", response_model=PacienteSalida, dependencies=[requiere_roles("recepcionista")])
def actualizar(id_paciente: int, datos: PacienteActualizar, db: Sesion, auditor: AuditorActual):
    return paciente_servicio.actualizar(db, id_paciente, datos, auditor)
