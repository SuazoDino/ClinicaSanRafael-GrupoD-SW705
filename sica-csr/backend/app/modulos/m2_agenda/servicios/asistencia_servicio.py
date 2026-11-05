"""Marcar asistencia («confirmada») o inasistencia («inasistente») (HU07)."""
from sqlalchemy.orm import Session

from app.modulos.m2_agenda.esquemas.cita import CitaSalida
from app.modulos.m2_agenda.servicios import cita_servicio
from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.excepciones import Conflicto


def marcar(db: Session, id_cita: int, asistio: bool, auditor: Auditor) -> CitaSalida:
    cita = cita_servicio.obtener(db, id_cita)
    if cita.estado != "registrada":
        raise Conflicto("La asistencia ya fue registrada.")
    cita.estado = "confirmada" if asistio else "inasistente"
    auditor.registrar("ASISTENCIA", "cita", cita.id_cita, cita.estado)
    db.commit()
    return cita_servicio.una_salida(db, cita)
