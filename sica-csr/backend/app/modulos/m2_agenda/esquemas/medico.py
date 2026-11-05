"""Esquemas de médico y especialidad para listas desplegables."""
from pydantic import BaseModel, ConfigDict


class EspecialidadSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_especialidad: int
    nombre: str


class MedicoSalida(BaseModel):
    id_medico: int
    nombres: str
    apellidos: str
    colegiatura: str
    id_especialidad: int
    especialidad: str  # nombre de la especialidad
