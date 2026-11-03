"""Modelos (tablas) del módulo M2. Al crear un modelo nuevo, impórtalo aquí."""
from app.modulos.m2_agenda.modelos.cita import Cita
from app.modulos.m2_agenda.modelos.especialidad import Especialidad
from app.modulos.m2_agenda.modelos.horario_medico import HorarioMedico
from app.modulos.m2_agenda.modelos.medico import Medico
from app.modulos.m2_agenda.modelos.recordatorio import Recordatorio

__all__ = ["Cita", "Especialidad", "HorarioMedico", "Medico", "Recordatorio"]
