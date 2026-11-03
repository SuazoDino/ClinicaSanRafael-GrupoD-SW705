"""Une los endpoints del módulo M2. Al crear un archivo de rutas nuevo, agrégalo aquí."""
from fastapi import APIRouter

from app.modulos.m2_agenda.rutas import agenda_medico, citas, disponibilidad

router = APIRouter()
for _sub in (disponibilidad, citas, agenda_medico):
    router.include_router(_sub.router)
