"""Webhook de respuestas a los recordatorios (HU09): Twilio lo llama cuando el paciente contesta por WhatsApp/SMS.

No usa JWT (lo llama Twilio, no un usuario): se valida la firma X-Twilio-Signature cuando hay TWILIO_AUTH_TOKEN.
Sin credenciales (modo consola de desarrollo) se acepta sin firma, para poder probarlo con curl.
"""
from xml.sax.saxutils import escape

from fastapi import APIRouter, Request, Response

from app.modulos.m2_agenda.servicios import recordatorio_servicio
from app.nucleo.config import obtener_configuracion
from app.nucleo.dependencias import Sesion
from app.nucleo.excepciones import Prohibido
from app.nucleo.notificaciones import proveedor

router = APIRouter(prefix="/recordatorios", tags=["M2 · Recordatorios"])


@router.post("/respuesta", response_class=Response, responses={200: {"content": {"application/xml": {}}}})
async def respuesta(request: Request, db: Sesion):
    """Recibe From y Body (formulario de Twilio) y contesta en TwiML."""
    formulario = {clave: str(valor) for clave, valor in (await request.form()).items()}
    config = obtener_configuracion()
    if config.twilio_auth_token:
        url = config.twilio_webhook_url or str(request.url)
        if not proveedor.firma_twilio_valida(url, formulario, request.headers.get("X-Twilio-Signature")):
            raise Prohibido("Firma de Twilio inválida")

    mensaje = recordatorio_servicio.procesar_respuesta(db, formulario.get("From", ""), formulario.get("Body", ""))
    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{escape(mensaje)}</Message></Response>'
    return Response(content=twiml, media_type="application/xml")
