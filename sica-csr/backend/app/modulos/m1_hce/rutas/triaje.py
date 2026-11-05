"""Registro de triaje y signos vitales (HU11 · RF02); la cita pasa a «triada».

Acceso (ERS 3.5): POST solo "enfermera"; GET del día "enfermera" y "administrador" (solo lectura).
"""
from datetime import date

from fastapi import APIRouter, status

from app.modulos.m1_hce.esquemas.triaje import TriajeCrear, TriajeSalida
from app.modulos.m1_hce.servicios import triaje_servicio
from app.modulos.m2_agenda.esquemas.cita import CitaSalida
from app.nucleo.dependencias import AuditorActual, Sesion, requiere_roles
from app.nucleo.tiempo import hoy

router = APIRouter(prefix="/triajes", tags=["M1 · Triaje"])


@router.get("/pendientes", response_model=list[CitaSalida], dependencies=[requiere_roles("enfermera", "administrador")])
def pendientes(db: Sesion, fecha: date | None = None):
    return triaje_servicio.pendientes(db, fecha or hoy())


@router.post(
    "",
    response_model=TriajeSalida,
    status_code=status.HTTP_201_CREATED,
    dependencies=[requiere_roles("enfermera")],
    responses={409: {"description": "La cita ya tiene triaje o no está «confirmada»"}},
)
def registrar(datos: TriajeCrear, db: Sesion, auditor: AuditorActual):
    return triaje_servicio.registrar(db, datos, auditor)
