"""Citas: registrar sin cupos duplicados (HU02), reprogramar o cancelar (HU10) y marcar asistencia (HU07).

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/citas", tags=["M2 · Citas"])
