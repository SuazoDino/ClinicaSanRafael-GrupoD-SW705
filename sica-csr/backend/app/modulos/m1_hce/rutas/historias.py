"""Endpoints de la HCE unificada (HU04 · RF03, RFN02 <2 s).

Acceso (ERS 3.5): solo "medico" (el administrador no abre la HCE).
"""
from fastapi import APIRouter

from app.modulos.m1_hce.esquemas.historia_clinica import HistoriaSalida
from app.modulos.m1_hce.servicios import hce_servicio
from app.nucleo.dependencias import AuditorActual, Sesion, requiere_roles

router = APIRouter(prefix="/historias", tags=["M1 · Historia clínica"])


@router.get("/{id_paciente}", response_model=HistoriaSalida, dependencies=[requiere_roles("medico")])
def obtener(id_paciente: int, db: Sesion, auditor: AuditorActual):
    return hce_servicio.obtener(db, id_paciente, auditor)
