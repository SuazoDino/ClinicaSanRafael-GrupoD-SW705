"""Une los endpoints del módulo M1. Al crear un archivo de rutas nuevo, agrégalo aquí."""
from fastapi import APIRouter

from app.modulos.m1_hce.rutas import cie10, consultas, historias, pacientes, triaje

router = APIRouter()
for _sub in (pacientes, historias, consultas, cie10, triaje):
    router.include_router(_sub.router)
