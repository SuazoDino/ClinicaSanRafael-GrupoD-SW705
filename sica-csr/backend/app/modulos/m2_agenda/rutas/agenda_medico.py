"""Agenda del día del médico que inició sesión (HU08).

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/agenda-medico", tags=["M2 · Agenda del médico"])
