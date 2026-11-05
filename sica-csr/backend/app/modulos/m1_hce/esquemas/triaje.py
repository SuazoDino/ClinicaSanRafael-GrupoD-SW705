"""Esquemas de triaje con rangos válidos de signos vitales (HU11). Los rangos son los CHECK de la tabla triaje."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

# campo: (mínimo, máximo, nombre para el mensaje). Igual que RANGOS_TRIAJE del frontend.
RANGOS_TRIAJE = {
    "presion_sistolica": (50, 300, "la presión sistólica"),
    "presion_diastolica": (30, 200, "la presión diastólica"),
    "frecuencia_cardiaca": (20, 250, "la frecuencia cardiaca"),
    "temperatura": (30, 45, "la temperatura"),
    "peso_kg": (0.5, 400, "el peso"),
    "talla_cm": (30, 250, "la talla"),
}


class TriajeCrear(BaseModel):
    id_cita: int
    presion_sistolica: int
    presion_diastolica: int
    frecuencia_cardiaca: int
    temperatura: float
    peso_kg: float
    talla_cm: float

    @field_validator(*RANGOS_TRIAJE)
    @classmethod
    def en_rango(cls, valor, info):
        minimo, maximo, nombre = RANGOS_TRIAJE[info.field_name]
        if not minimo <= valor <= maximo:
            raise PydanticCustomError(
                "fuera_de_rango", "Revisa {nombre}: debe estar entre {minimo} y {maximo}.",
                {"nombre": nombre, "minimo": minimo, "maximo": maximo},
            )
        return valor


class TriajeSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_triaje: int
    id_cita: int
    registrado_por: int
    fecha_registro: datetime
    presion_sistolica: int
    presion_diastolica: int
    frecuencia_cardiaca: int
    # float y no Decimal: Pydantic serializa Decimal como texto ("36.5")
    temperatura: float
    peso_kg: float
    talla_cm: float
