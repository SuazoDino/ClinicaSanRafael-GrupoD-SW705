"""Endpoints de consultas médicas: registrar con CIE-10 y receta (HU05) y anular con motivo (HU12).
Imprimir la receta (HU06) es solo frontend: usa los datos de la HCE.

Acceso (ERS 3.5): "medico".
"""
from fastapi import APIRouter, status

from app.modulos.m1_hce.esquemas.consulta_medica import ConsultaAnular, ConsultaCrear, ConsultaSalida
from app.modulos.m1_hce.servicios import consulta_servicio
from app.nucleo.dependencias import AuditorActual, Sesion, requiere_roles

router = APIRouter(prefix="/consultas", tags=["M1 · Consultas"], dependencies=[requiere_roles("medico")])


@router.post(
    "",
    response_model=ConsultaSalida,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "La cita no está «confirmada» ni «triada»"}},
)
def registrar(datos: ConsultaCrear, db: Sesion, auditor: AuditorActual):
    return consulta_servicio.registrar(db, datos, auditor)


@router.put("/{id_consulta}/anular", response_model=ConsultaSalida)
def anular(id_consulta: int, datos: ConsultaAnular, db: Sesion, auditor: AuditorActual):
    return consulta_servicio.anular(db, id_consulta, datos, auditor)
