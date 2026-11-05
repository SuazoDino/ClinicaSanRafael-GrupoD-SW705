from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class PacienteBase(BaseModel):
    nombres: str = Field(min_length=1, max_length=80)
    apellidos: str = Field(min_length=1, max_length=80)
    telefono: str | None = Field(default=None, max_length=15)
    email: EmailStr | None = None
    fecha_nacimiento: date

    @field_validator("fecha_nacimiento")
    @classmethod
    def no_futura(cls, valor: date) -> date:
        if valor > date.today():
            raise ValueError("La fecha de nacimiento no puede ser futura")
        return valor


class PacienteCrear(PacienteBase):
    dni: str = Field(pattern=r"^\d{8}$", description="DNI de 8 dígitos")
    antecedentes: str | None = None
    alergias: str | None = None


class PacienteActualizar(PacienteBase):
    """El DNI no se modifica: identifica al paciente y a su HCE."""


class PacienteSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_paciente: int
    dni: str
    nombres: str
    apellidos: str
    telefono: str | None
    email: str | None
    fecha_nacimiento: date
    id_historia: int
    numero_hce: str


class PacienteResumen(BaseModel):
    """Datos del paciente que acompañan a una cita (agenda, triaje)."""

    id_paciente: int
    dni: str
    nombres: str
    apellidos: str
    fecha_nacimiento: date
    telefono: str | None
    numero_hce: str
