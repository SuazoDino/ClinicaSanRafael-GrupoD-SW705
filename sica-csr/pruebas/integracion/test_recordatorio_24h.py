"""HU09 · Recordatorio automático 24 h antes de la cita y respuesta del paciente (1 confirma, 2 cancela)."""
import base64
import hashlib
import hmac
from datetime import datetime, timedelta

from app.modulos.m2_agenda.modelos import Recordatorio
from app.modulos.m2_agenda.servicios import recordatorio_servicio


def test_recordatorio_se_envia_24h_antes(cliente, agenda, agendar, db, monkeypatch):
    enviados = []
    monkeypatch.setattr(
        recordatorio_servicio.proveedor, "enviar_mensaje",
        lambda canal, destino, texto: enviados.append((canal, destino, texto)) or True,
    )
    cita = agendar("09:00")  # mañana
    programado = datetime.fromisoformat(cita["recordatorio"]["fecha_programada"])
    assert programado == datetime.fromisoformat(f"{cita['fecha']}T09:00:00") - timedelta(hours=24)

    # Un minuto antes de la hora programada todavía no se envía
    assert recordatorio_servicio.procesar_pendientes(db, programado - timedelta(minutes=1)) == 0
    assert recordatorio_servicio.procesar_pendientes(db, programado) == 1

    assert db.get(Recordatorio, cita["recordatorio"]["id_recordatorio"]).estado == "enviado"
    canal, destino, texto = enviados[0]
    assert (canal, destino) == ("whatsapp", "+51911111111")
    assert "09:00" in texto and "Rosa Prueba" in texto


def test_cita_cancelada_no_recibe_recordatorio(cliente, agenda, agendar, db, monkeypatch):
    enviados = []
    monkeypatch.setattr(recordatorio_servicio.proveedor, "enviar_mensaje", lambda *a: enviados.append(a) or True)
    cita = agendar("10:00")
    cliente.put(f"/api/citas/{cita['id_cita']}/cancelar", json={"motivo": "No puede"}, headers=agenda["recepcion"])
    programado = datetime.fromisoformat(cita["recordatorio"]["fecha_programada"])
    recordatorio_servicio.procesar_pendientes(db, programado)
    assert enviados == []
    assert db.get(Recordatorio, cita["recordatorio"]["id_recordatorio"]).estado == "fallido"


# ---------- Respuesta del paciente (webhook de Twilio) ----------

def _cita_con_recordatorio_enviado(cliente, agenda, agendar, db, monkeypatch, hora="11:00"):
    monkeypatch.setattr(recordatorio_servicio.proveedor, "enviar_mensaje", lambda *a: True)
    cita = agendar(hora)
    programado = datetime.fromisoformat(cita["recordatorio"]["fecha_programada"])
    recordatorio_servicio.procesar_pendientes(db, programado)
    return cita


def _responder(cliente, texto, telefono="whatsapp:+51911111111", **cabeceras):
    return cliente.post("/api/recordatorios/respuesta", data={"From": telefono, "Body": texto}, headers=cabeceras)


def test_paciente_cancela_respondiendo_2_y_se_libera_el_cupo(cliente, agenda, agendar, db, monkeypatch):
    cita = _cita_con_recordatorio_enviado(cliente, agenda, agendar, db, monkeypatch)
    respuesta = _responder(cliente, " 2 ")
    assert respuesta.status_code == 200
    assert "<Message>" in respuesta.text and "cancelada" in respuesta.text

    citas = cliente.get("/api/citas", params={"id_paciente": agenda["id_paciente"]}, headers=agenda["recepcion"]).json()
    cancelada = next(c for c in citas if c["id_cita"] == cita["id_cita"])
    assert cancelada["estado"] == "cancelada"
    assert cancelada["recordatorio"]["respuesta"] == "cancela"
    assert agendar("11:00")["estado"] == "registrada"  # el cupo quedó libre


def test_paciente_confirma_respondiendo_1(cliente, agenda, agendar, db, monkeypatch):
    cita = _cita_con_recordatorio_enviado(cliente, agenda, agendar, db, monkeypatch)
    assert "confirmada" in _responder(cliente, "Sí").text
    citas = cliente.get("/api/citas", params={"id_paciente": agenda["id_paciente"]}, headers=agenda["recepcion"]).json()
    confirmada = next(c for c in citas if c["id_cita"] == cita["id_cita"])
    assert confirmada["estado"] == "registrada"  # «confirmada» se reserva para cuando llega (HU07)
    assert confirmada["recordatorio"]["respuesta"] == "confirma"


def test_respuesta_de_numero_desconocido_o_texto_libre(cliente, agenda, agendar, db, monkeypatch):
    _cita_con_recordatorio_enviado(cliente, agenda, agendar, db, monkeypatch)
    assert "No encontramos" in _responder(cliente, "1", telefono="whatsapp:+51999000999").text
    assert "Responda 1" in _responder(cliente, "hola").text


def test_webhook_rechaza_firma_invalida(cliente, agenda, agendar, db, monkeypatch):
    from app.nucleo.config import obtener_configuracion
    from app.nucleo.notificaciones import proveedor

    _cita_con_recordatorio_enviado(cliente, agenda, agendar, db, monkeypatch)
    config = obtener_configuracion()
    monkeypatch.setattr(config, "twilio_auth_token", "token-prueba")
    monkeypatch.setattr(config, "twilio_webhook_url", "https://sica.ejemplo.pe/api/recordatorios/respuesta")

    assert _responder(cliente, "2", **{"X-Twilio-Signature": "falsa"}).status_code == 403
    # Firma calculada como lo hace Twilio: HMAC-SHA1(URL + parámetros ordenados) en base64
    datos = {"Body": "1", "From": "whatsapp:+51911111111"}
    firmado = config.twilio_webhook_url + "".join(k + datos[k] for k in sorted(datos))
    firma = base64.b64encode(hmac.new(b"token-prueba", firmado.encode(), hashlib.sha1).digest()).decode()
    assert proveedor.firma_twilio_valida(config.twilio_webhook_url, datos, firma)
    assert _responder(cliente, "1", **{"X-Twilio-Signature": firma}).status_code == 200
