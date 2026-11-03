"""Endpoints de consultas médicas: registrar con CIE-10 y receta (HU05), imprimir receta (HU06) y anular con motivo (HU12).

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/consultas", tags=["M1 · Consultas"])
