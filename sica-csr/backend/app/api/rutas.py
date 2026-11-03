"""Punto único donde se registran todos los endpoints bajo /api.

Para un módulo nuevo (p. ej. m3_laboratorio) basta con agregar su router aquí.
"""
from fastapi import APIRouter

from app.modulos.m1_hce.rutas import router as router_m1
from app.modulos.m2_agenda.rutas import router as router_m2
from app.nucleo.autenticacion.rutas import router as router_auth

router_api = APIRouter(prefix="/api")
router_api.include_router(router_auth)
router_api.include_router(router_m1)
router_api.include_router(router_m2)
