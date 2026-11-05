"""Registrar triaje y cambiar la cita a «triada» (HU11)."""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modulos.m1_hce.esquemas.triaje import TriajeCrear, TriajeSalida
from app.modulos.m1_hce.modelos import Triaje
from app.modulos.m2_agenda.esquemas.cita import CitaSalida
from app.modulos.m2_agenda.servicios import cita_servicio
from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.excepciones import Conflicto
from app.nucleo.tiempo import ahora


def pendientes(db: Session, fecha: date) -> list[CitaSalida]:
    """Citas del día que ya llegaron (confirmada) o ya tienen triaje (triada)."""
    return cita_servicio.listar(db, fecha=fecha, estados=("confirmada", "triada"))


def registrar(db: Session, datos: TriajeCrear, auditor: Auditor) -> TriajeSalida:
    if db.scalar(select(Triaje.id_triaje).where(Triaje.id_cita == datos.id_cita)) is not None:
        raise Conflicto("Esta cita ya tiene triaje.")
    # La cita pertenece a M2: se cambia a través de su servicio
    cita_servicio.cambiar_estado(db, datos.id_cita, desde="confirmada", hacia="triada")
    triaje = Triaje(**datos.model_dump(), registrado_por=auditor.id_usuario, fecha_registro=ahora())
    db.add(triaje)
    db.flush()
    auditor.registrar("CREAR", "triaje", triaje.id_triaje, f"cita {datos.id_cita}")
    db.commit()
    return TriajeSalida.model_validate(triaje)
