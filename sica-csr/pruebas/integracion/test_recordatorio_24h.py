"""HU09 · Recordatorio automático 24 h antes de la cita."""
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
