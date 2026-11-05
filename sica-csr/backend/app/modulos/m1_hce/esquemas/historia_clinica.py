"""Esquemas de la vista unificada de la HCE (HU04): antecedentes, alergias, consultas con diagnósticos, recetas y triaje."""
from pydantic import BaseModel

from app.modulos.m1_hce.esquemas.consulta_medica import ConsultaSalida
from app.modulos.m1_hce.esquemas.paciente import PacienteSalida
from app.modulos.m1_hce.esquemas.receta import RecetaSalida
from app.modulos.m1_hce.esquemas.triaje import TriajeSalida
from app.modulos.m2_agenda.esquemas.cita import CitaConMedico
from app.modulos.m2_agenda.esquemas.medico import MedicoSalida


class DiagnosticoSalida(BaseModel):
    id_consulta: int
    codigo_cie10: str
    es_principal: bool
    descripcion: str


class ConsultaHCE(ConsultaSalida):
    medico: MedicoSalida
    anulada_por_usuario: str | None  # username de quien anuló
    diagnosticos: list[DiagnosticoSalida]  # el principal primero
    receta: RecetaSalida | None


class HistoriaSalida(BaseModel):
    paciente: PacienteSalida
    antecedentes: str | None
    alergias: str | None
    triaje_reciente: TriajeSalida | None
    consultas: list[ConsultaHCE]  # todas, incluidas las anuladas, más recientes primero
    citas_por_atender: list[CitaConMedico]  # de hoy, en estado confirmada o triada
