"""Esquemas de cita: crear, reprogramar, cancelar (motivo obligatorio), asistencia y salida."""
from datetime import date, time

from pydantic import BaseModel, ConfigDict

from app.modulos.m1_hce.esquemas.paciente import PacienteResumen
from app.modulos.m1_hce.esquemas.triaje import TriajeSalida
from app.modulos.m2_agenda.esquemas.medico import MedicoSalida
from app.modulos.m2_agenda.esquemas.recordatorio import RecordatorioSalida
from app.nucleo.validacion import texto_obligatorio


class CitaCrear(BaseModel):
    id_paciente: int
    id_medico: int
    fecha: date
    hora: time


class CitaReprogramar(BaseModel):
    fecha: date
    hora: time


class CitaCancelar(BaseModel):
    motivo: texto_obligatorio("Indica el motivo de la cancelación.", 200)


class CitaAsistencia(BaseModel):
    asistio: bool


class CitaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_cita: int
    id_paciente: int
    id_medico: int
    fecha: date
    hora: time
    estado: str
    motivo_cancelacion: str | None


class CitaConMedico(CitaBase):
    medico: MedicoSalida


class CitaSalida(CitaConMedico):
    paciente: PacienteResumen
    recordatorio: RecordatorioSalida | None  # el último programado
    triaje: TriajeSalida | None
