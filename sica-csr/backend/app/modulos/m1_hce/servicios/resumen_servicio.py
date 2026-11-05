"""Lecturas de M1 que necesita M2 para armar sus respuestas (paciente y triaje de cada cita).

Están aparte para que M2 no dependa de los servicios de M1 que a su vez usan M2 (triaje, consultas).
"""
from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modulos.m1_hce.esquemas.paciente import PacienteResumen
from app.modulos.m1_hce.esquemas.triaje import TriajeSalida
from app.modulos.m1_hce.modelos import Paciente, Triaje


def pacientes_por_id(db: Session, ids: Iterable[int]) -> dict[int, PacienteResumen]:
    ids = set(ids)
    if not ids:
        return {}
    pacientes = db.scalars(select(Paciente).where(Paciente.id_paciente.in_(ids)).options(selectinload(Paciente.historia)))
    return {
        p.id_paciente: PacienteResumen(
            id_paciente=p.id_paciente, dni=p.dni, nombres=p.nombres, apellidos=p.apellidos,
            fecha_nacimiento=p.fecha_nacimiento, telefono=p.telefono, numero_hce=p.historia.numero_hce,
        )
        for p in pacientes
    }


def existe_paciente(db: Session, id_paciente: int) -> bool:
    return db.get(Paciente, id_paciente) is not None


def triajes_por_cita(db: Session, ids_cita: Iterable[int]) -> dict[int, TriajeSalida]:
    ids_cita = set(ids_cita)
    if not ids_cita:
        return {}
    triajes = db.scalars(select(Triaje).where(Triaje.id_cita.in_(ids_cita)))
    return {t.id_cita: TriajeSalida.model_validate(t) for t in triajes}
