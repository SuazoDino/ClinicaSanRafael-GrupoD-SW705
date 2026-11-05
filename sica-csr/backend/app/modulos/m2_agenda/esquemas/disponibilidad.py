"""Esquemas de cupos libres/ocupados por médico y fecha (HU01)."""
from datetime import time
from typing import Literal

from pydantic import BaseModel


class CupoSalida(BaseModel):
    hora: time
    estado: Literal["libre", "ocupado", "pasado"]
