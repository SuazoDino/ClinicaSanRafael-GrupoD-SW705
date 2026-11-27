"""Contrato de envío de mensajes al paciente (HU09).

Los módulos dependen de `Notificador` y no de Twilio ni del correo: en las pruebas se usa
`NotificadorSimulado` y el envío real se conecta en otro sprint sin cambiar el servicio que lo usa.
"""
from typing import Protocol


class Notificador(Protocol):
    def enviar(self, dni: str, mensaje: str) -> bool:
        """Envía `mensaje` al paciente con ese DNI. Devuelve True si el envío fue aceptado."""
        ...


class NotificadorSimulado:
    """Guarda en memoria lo que «envía». Con falla=True rechaza todos los envíos."""

    def __init__(self, falla: bool = False) -> None:
        self.falla = falla
        self.enviados: list[tuple[str, str]] = []

    def enviar(self, dni: str, mensaje: str) -> bool:
        if self.falla:
            return False
        self.enviados.append((dni, mensaje))
        return True
