"""Esquemas de consulta médica (HU05) y de anulación con motivo (HU12)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

from app.nucleo.validacion import TextoOpcional, texto_obligatorio


class DiagnosticoEntrada(BaseModel):
    codigo_cie10: str
    es_principal: bool = False


class ConsultaCrear(BaseModel):
    id_cita: int
    motivo: texto_obligatorio("Indica el motivo de la consulta.", 300)
    evolucion: TextoOpcional = None
    diagnosticos: list[DiagnosticoEntrada]
    indicaciones: TextoOpcional = None  # si viene, se emite la receta

    @field_validator("diagnosticos")
    @classmethod
    def un_principal(cls, diagnosticos: list[DiagnosticoEntrada]) -> list[DiagnosticoEntrada]:
        if not diagnosticos:
            raise PydanticCustomError("sin_diagnostico", "Agrega al menos un diagnóstico CIE-10.")
        if sum(d.es_principal for d in diagnosticos) != 1:
            raise PydanticCustomError("principal", "Marca un solo diagnóstico como principal.")
        if len({d.codigo_cie10 for d in diagnosticos}) != len(diagnosticos):
            raise PydanticCustomError("repetido", "Un diagnóstico CIE-10 está repetido.")
        return diagnosticos


class ConsultaAnular(BaseModel):
    motivo: texto_obligatorio("Indica el motivo de la anulación.", 300)


class ConsultaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_consulta: int
    id_cita: int
    id_historia: int
    fecha_consulta: datetime
    motivo: str
    evolucion: str | None
    anulada: bool
    motivo_anulacion: str | None
    anulada_por: int | None
    fecha_anulacion: datetime | None
