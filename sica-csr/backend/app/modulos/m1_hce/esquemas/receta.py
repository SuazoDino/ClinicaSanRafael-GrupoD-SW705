"""Esquemas de receta (HU05, HU06)."""
from datetime import date

from pydantic import BaseModel, ConfigDict


class RecetaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_receta: int
    id_consulta: int
    indicaciones: str
    fecha_emision: date
