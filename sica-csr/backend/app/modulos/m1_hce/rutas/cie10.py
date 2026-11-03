"""Búsqueda en el catálogo CIE-10 (HU05), p. ej. GET /cie10?texto=diabetes.

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/cie10", tags=["M1 · CIE-10"])
