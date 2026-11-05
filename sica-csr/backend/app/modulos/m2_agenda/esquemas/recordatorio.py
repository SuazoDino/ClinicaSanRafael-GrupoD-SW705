"""Esquemas de recordatorio (HU09)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RecordatorioSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_recordatorio: int
    id_cita: int
    canal: str
    fecha_programada: datetime
    estado: str
    respuesta: str | None
