"""Agenda del día por médico (HU08).

Acceso (ERS 3.5): "medico" ve solo la suya (sale de su usuario); "recepcionista" indica ?id_medico= (solo lectura).
"""
from datetime import date

from fastapi import APIRouter

from app.modulos.m2_agenda.esquemas.cita import CitaSalida
from app.modulos.m2_agenda.servicios import cita_servicio
from app.nucleo.dependencias import Sesion, UsuarioActual, requiere_roles
from app.nucleo.tiempo import hoy

router = APIRouter(prefix="/agenda-medico", tags=["M2 · Agenda del médico"])


@router.get("", response_model=list[CitaSalida], dependencies=[requiere_roles("medico", "recepcionista")])
def del_dia(db: Sesion, usuario: UsuarioActual, fecha: date | None = None, id_medico: int | None = None):
    return cita_servicio.agenda_medico(db, usuario, fecha or hoy(), id_medico)
