"""HU09 · Qué citas se recuerdan y envío del recordatorio a través del contrato `Notificador`.

Une la agenda (M2) con el núcleo de notificaciones sin acoplarlos: estas funciones no tocan la BD ni
saben quién envía el mensaje; reciben las citas, la hora actual y un objeto que cumple el contrato.
"""
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime

from app.modulos.m2_agenda.servicios.cita_servicio import ANTICIPACION_RECORDATORIO, MODIFICABLES
from app.nucleo.notificaciones.contrato import Notificador


@dataclass
class CitaRecordable:
    """Lo mínimo de una cita para decidir y enviar su recordatorio."""

    id_cita: int
    dni: str
    inicio: datetime
    estado: str = "registrada"
    recordada: bool = False


def citas_a_recordar(citas: Iterable[CitaRecordable], ahora: datetime) -> list[CitaRecordable]:
    """Citas vigentes, aún no recordadas, que empiezan después de `ahora` y dentro de las próximas 24 h."""
    limite = ahora + ANTICIPACION_RECORDATORIO
    return [c for c in citas if c.estado in MODIFICABLES and not c.recordada and ahora < c.inicio <= limite]


def mensaje_recordatorio(cita: CitaRecordable) -> str:
    return (
        f"Clínica San Rafael: le recordamos su cita del {cita.inicio:%d/%m/%Y} a las {cita.inicio:%H:%M}. "
        "Responda 1 para confirmar o 2 para cancelar."
    )


def enviar_recordatorios(
    citas: Iterable[CitaRecordable], ahora: datetime, notificador: Notificador
) -> list[CitaRecordable]:
    """Envía el recordatorio de cada cita que corresponde y la marca recordada solo si el envío fue aceptado.

    Devuelve las citas recordadas en esta pasada; las que fallaron se reintentan en la siguiente.
    """
    recordadas = []
    for cita in citas_a_recordar(citas, ahora):
        if notificador.enviar(cita.dni, mensaje_recordatorio(cita)):
            cita.recordada = True
            recordadas.append(cita)
    return recordadas
