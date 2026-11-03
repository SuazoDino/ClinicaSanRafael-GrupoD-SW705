"""Envío de recordatorios 24 h antes de la cita (HU09 · RF05).

Pendiente: implementar siguiendo el ejemplo de pacientes (ver GUIA_DESARROLLO.md).
"""
from sqlalchemy.orm import Session


def procesar_pendientes(db: Session) -> int:
    """Envía los recordatorios con fecha_programada vencida y estado 'pendiente'.

    Usar app.nucleo.notificaciones.proveedor.enviar_mensaje() y marcar cada uno como
    'enviado' o 'fallido'. Devuelve cuántos se procesaron.
    """
    return 0
