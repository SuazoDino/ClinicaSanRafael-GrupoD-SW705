"""Cupos libres consolidados por especialidad, médico y fecha (HU01 · RF07, RF09). Incluye listas de especialidades y médicos.

Acceso (ERS 3.5): "recepcionista". La lista de médicos también la lee el médico (encabezado de su agenda, HU08).
"""
from datetime import date

from fastapi import APIRouter, Query

from app.modulos.m2_agenda.esquemas.disponibilidad import CupoSalida
from app.modulos.m2_agenda.esquemas.medico import EspecialidadSalida, MedicoSalida
from app.modulos.m2_agenda.servicios import disponibilidad_servicio
from app.nucleo.dependencias import Sesion, requiere_roles

router = APIRouter(prefix="/disponibilidad", tags=["M2 · Disponibilidad"])
RECEPCION = [requiere_roles("recepcionista")]


@router.get("/especialidades", response_model=list[EspecialidadSalida], dependencies=RECEPCION)
def especialidades(db: Sesion):
    return disponibilidad_servicio.especialidades(db)


@router.get("/medicos", response_model=list[MedicoSalida], dependencies=[requiere_roles("recepcionista", "medico")])
def medicos(db: Sesion, id_especialidad: int | None = None):
    return disponibilidad_servicio.medicos(db, id_especialidad)


@router.get("/dias", response_model=list[date], dependencies=RECEPCION)
def dias(
    db: Sesion,
    desde: date,
    cantidad: int = Query(default=6, ge=1, le=30),
    id_medico: int | None = None,
    id_especialidad: int | None = None,
):
    return disponibilidad_servicio.dias_con_atencion(db, desde, cantidad, id_medico, id_especialidad)


@router.get("", response_model=list[CupoSalida], dependencies=RECEPCION)
def cupos(db: Sesion, id_medico: int, fecha: date):
    return disponibilidad_servicio.cupos(db, id_medico, fecha)
