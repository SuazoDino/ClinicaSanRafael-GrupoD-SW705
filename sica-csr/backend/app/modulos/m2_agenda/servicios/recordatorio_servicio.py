"""Recordatorios 24 h antes de la cita (HU09 · RF05).

- procesar_pendientes: envía los vencidos; lo llama recordatorio_programador cada N minutos.
- procesar_respuesta: el paciente responde 1 (confirma) o 2 (cancela); lo llama el webhook de Twilio.
"""
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
        "Responda 1 para confirmar o 2 para cancelar."
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


CONFIRMA = {"1", "si", "sí", "confirmo", "confirmar"}
CANCELA = {"2", "no", "cancelo", "cancelar"}
MOTIVO_CANCELACION_PACIENTE = "Cancelada por el paciente al responder el recordatorio."


def procesar_respuesta(db: Session, telefono: str, texto: str) -> str:
    """Registra la respuesta del paciente al último recordatorio enviado y devuelve el mensaje de contestación.

    «Confirma» solo queda en el recordatorio: el estado «confirmada» de la cita significa que el paciente
    llegó (HU07). «Cancela» cancela la cita y libera el cupo.
    """
    respuesta = texto.strip().lower().rstrip(".!")
    if respuesta not in CONFIRMA | CANCELA:
        return "Responda 1 para confirmar su cita o 2 para cancelarla."

    ids_paciente = resumen_servicio.ids_por_telefono(db, telefono)
    momento = ahora()
    candidatos = db.execute(
        select(Recordatorio, Cita)
        .join(Cita, Cita.id_cita == Recordatorio.id_cita)
        .where(
            Cita.id_paciente.in_(ids_paciente),
            Cita.estado.in_(MODIFICABLES),
            Recordatorio.estado == "enviado",
            Recordatorio.respuesta.is_(None),
        )
        .order_by(Cita.fecha, Cita.hora)
    ).all() if ids_paciente else []
    vigente = next(((r, c) for r, c in candidatos if datetime.combine(c.fecha, c.hora) > momento), None)
    if vigente is None:
        return "No encontramos una cita pendiente para este número. Comuníquese con la Clínica San Rafael."

    recordatorio, cita = vigente
    cuando = f"{cita.fecha:%d/%m/%Y} a las {cita.hora:%H:%M}"
    if respuesta in CONFIRMA:
        recordatorio.respuesta = "confirma"
        mensaje = f"Gracias. Su cita del {cuando} quedó confirmada."
    else:
        recordatorio.respuesta = "cancela"
        cita.estado, cita.motivo_cancelacion = "cancelada", MOTIVO_CANCELACION_PACIENTE
        mensaje = f"Su cita del {cuando} fue cancelada. Para reprogramarla, comuníquese con la clínica."
    db.commit()
    log.info("Recordatorio %s: el paciente %s", recordatorio.id_recordatorio, recordatorio.respuesta)
    return mensaje
