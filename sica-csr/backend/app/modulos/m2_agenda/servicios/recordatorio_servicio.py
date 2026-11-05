"""Envío de recordatorios 24 h antes de la cita (HU09 · RF05). Lo llama recordatorio_programador cada N minutos."""
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modulos.m1_hce.servicios import resumen_servicio
from app.modulos.m2_agenda.modelos import Cita, Recordatorio
from app.modulos.m2_agenda.servicios import disponibilidad_servicio
from app.modulos.m2_agenda.servicios.cita_servicio import ANTICIPACION_RECORDATORIO, MODIFICABLES
from app.nucleo.notificaciones import proveedor
from app.nucleo.tiempo import ahora

log = logging.getLogger("recordatorios")


def _mensaje(cita: Cita, medico) -> str:
    return (
        f"Clínica San Rafael: le recordamos su cita el {cita.fecha:%d/%m/%Y} a las {cita.hora:%H:%M} "
        f"con Dr(a). {medico.nombres} {medico.apellidos} ({medico.especialidad}). "
        "Si no podrá asistir, comuníquese con la clínica."
    )


def procesar_pendientes(db: Session, momento: datetime | None = None) -> int:
    """Envía los recordatorios con fecha_programada vencida y estado 'pendiente'; marca 'enviado' o 'fallido'.

    Un recordatorio que ya no corresponde (cita cancelada, atendida o reprogramada a otra hora) no se envía y
    queda como 'fallido'. Devuelve cuántos se procesaron.
    """
    momento = momento or ahora()
    pendientes = db.execute(
        select(Recordatorio, Cita)
        .join(Cita, Cita.id_cita == Recordatorio.id_cita)
        .where(Recordatorio.estado == "pendiente", Recordatorio.fecha_programada <= momento)
        .order_by(Recordatorio.fecha_programada)
    ).all()
    if not pendientes:
        return 0

    pacientes = resumen_servicio.pacientes_por_id(db, {c.id_paciente for _, c in pendientes})
    medicos = disponibilidad_servicio.medicos_por_id(db, {c.id_medico for _, c in pendientes})
    for recordatorio, cita in pendientes:
        vigente = (
            cita.estado in MODIFICABLES
            and recordatorio.fecha_programada == datetime.combine(cita.fecha, cita.hora) - ANTICIPACION_RECORDATORIO
        )
        telefono = pacientes[cita.id_paciente].telefono
        if not vigente:
            recordatorio.estado = "fallido"
            log.info("Recordatorio %s omitido: la cita %s cambió", recordatorio.id_recordatorio, cita.id_cita)
        elif not telefono:
            recordatorio.estado = "fallido"
            log.warning("Recordatorio %s sin teléfono del paciente %s", recordatorio.id_recordatorio, cita.id_paciente)
        else:
            enviado = proveedor.enviar_mensaje(recordatorio.canal, telefono, _mensaje(cita, medicos[cita.id_medico]))
            recordatorio.estado = "enviado" if enviado else "fallido"
    db.commit()
    return len(pendientes)
