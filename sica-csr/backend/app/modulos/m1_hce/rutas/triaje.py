"""Registro de triaje y signos vitales (HU11 · RF02); la cita pasa a «triada».

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/triajes", tags=["M1 · Triaje"])
