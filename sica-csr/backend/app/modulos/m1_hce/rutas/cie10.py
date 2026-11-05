"""Búsqueda en el catálogo CIE-10 (HU05), p. ej. GET /cie10?texto=diabetes.

Acceso (ERS 3.5): "medico".
"""
from fastapi import APIRouter, Query

from app.modulos.m1_hce.esquemas.cie10 import Cie10Salida
from app.modulos.m1_hce.servicios import cie10_servicio
from app.nucleo.dependencias import Sesion, requiere_roles

router = APIRouter(prefix="/cie10", tags=["M1 · CIE-10"])


@router.get("", response_model=list[Cie10Salida], dependencies=[requiere_roles("medico")])
def buscar(db: Sesion, texto: str = Query(min_length=2, description="Código o parte de la descripción")):
    return cie10_servicio.buscar(db, texto)
