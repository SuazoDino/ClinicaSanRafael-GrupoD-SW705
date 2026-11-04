"""Agenda del día por médico (HU08).

Acceso (ERS 3.5): "medico" ve solo la suya (id_medico del token); "recepcionista" indica ?id_medico= (solo lectura).

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/agenda-medico", tags=["M2 · Agenda del médico"])
