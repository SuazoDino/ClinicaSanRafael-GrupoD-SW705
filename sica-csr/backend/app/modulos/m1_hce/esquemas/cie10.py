"""Esquema de salida del catálogo CIE-10 (código y descripción)."""
from pydantic import BaseModel, ConfigDict


class Cie10Salida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    codigo: str
    descripcion: str
