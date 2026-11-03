"""Envío de mensajes (SMS, WhatsApp y correo).

Si no hay credenciales en el .env, el mensaje se imprime en consola: así se puede
desarrollar y probar sin gastar en Twilio.
"""
import logging
import smtplib
from email.message import EmailMessage

import httpx

from app.nucleo.config import obtener_configuracion

log = logging.getLogger("notificaciones")


def enviar_mensaje(canal: str, destino: str, texto: str, asunto: str = "Clínica San Rafael") -> bool:
    """canal: 'sms', 'whatsapp' o 'email'. Devuelve True si el envío fue aceptado."""
    config = obtener_configuracion()
    try:
        if canal == "email" and config.smtp_host:
            return _enviar_correo(destino, asunto, texto)
        if canal in ("sms", "whatsapp") and config.twilio_account_sid:
            return _enviar_twilio(canal, destino, texto)
        log.warning("[MODO CONSOLA] %s → %s: %s", canal.upper(), destino, texto)
        return True
    except Exception:
        log.exception("Error al enviar %s a %s", canal, destino)
        return False


def _enviar_correo(destino: str, asunto: str, texto: str) -> bool:
    config = obtener_configuracion()
    mensaje = EmailMessage()
    mensaje["From"] = config.smtp_remitente or config.smtp_usuario
    mensaje["To"] = destino
    mensaje["Subject"] = asunto
    mensaje.set_content(texto)
    with smtplib.SMTP(config.smtp_host, config.smtp_puerto, timeout=15) as smtp:
        smtp.starttls()
        if config.smtp_usuario:
            smtp.login(config.smtp_usuario, config.smtp_clave)
        smtp.send_message(mensaje)
    return True


def _enviar_twilio(canal: str, destino: str, texto: str) -> bool:
    config = obtener_configuracion()
    if canal == "whatsapp":
        origen, destino = f"whatsapp:{config.twilio_numero_whatsapp}", f"whatsapp:{destino}"
    else:
        origen = config.twilio_numero_sms
    respuesta = httpx.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{config.twilio_account_sid}/Messages.json",
        auth=(config.twilio_account_sid, config.twilio_auth_token),
        data={"From": origen, "To": destino, "Body": texto},
        timeout=15,
    )
    return respuesta.is_success
