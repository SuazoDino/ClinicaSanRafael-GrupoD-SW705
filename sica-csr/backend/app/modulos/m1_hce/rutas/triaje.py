"""Registro de triaje y signos vitales (HU11 · RF02); la cita pasa a «triada».

Acceso (ERS 3.5): POST solo "enfermera"; GET del día "enfermera" y "administrador" (solo lectura).

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/triajes", tags=["M1 · Triaje"])
