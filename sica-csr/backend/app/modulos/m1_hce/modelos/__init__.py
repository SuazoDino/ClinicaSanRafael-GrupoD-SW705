"""Modelos (tablas) del módulo M1. Al crear un modelo nuevo, impórtalo aquí."""
from app.modulos.m1_hce.modelos.cie10 import Cie10
from app.modulos.m1_hce.modelos.consulta_medica import ConsultaMedica
from app.modulos.m1_hce.modelos.diagnostico_consulta import DiagnosticoConsulta
from app.modulos.m1_hce.modelos.historia_clinica import HistoriaClinica
from app.modulos.m1_hce.modelos.paciente import Paciente
from app.modulos.m1_hce.modelos.receta import Receta
from app.modulos.m1_hce.modelos.triaje import Triaje

__all__ = ["Cie10", "ConsultaMedica", "DiagnosticoConsulta", "HistoriaClinica", "Paciente", "Receta", "Triaje"]
