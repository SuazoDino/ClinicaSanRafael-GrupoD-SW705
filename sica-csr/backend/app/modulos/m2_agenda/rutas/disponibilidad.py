"""Cupos libres consolidados por especialidad, médico y fecha (HU01 · RF07, RF09). Incluye listas de especialidades y médicos.

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/disponibilidad", tags=["M2 · Disponibilidad"])
