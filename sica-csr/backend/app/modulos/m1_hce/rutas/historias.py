"""Endpoints de la HCE unificada (HU04 · RF03, RFN02 <2 s).

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/historias", tags=["M1 · Historia clínica"])
