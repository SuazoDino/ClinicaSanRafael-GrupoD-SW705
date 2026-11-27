"""HU09 · Recordatorio 24 h antes de la cita a través del contrato Notificador (Guía S13, tabla 2.1).

La agenda (M2) decide qué citas se recuerdan; quién envía el mensaje lo decide el núcleo de notificaciones.
Aquí se usa NotificadorSimulado: no hay BD, ni Twilio, ni reloj real (AHORA es fijo).
"""
from datetime import datetime, timedelta

import pytest

from app.modulos.m2_agenda.servicios.recordatorios import CitaRecordable, citas_a_recordar, enviar_recordatorios
from app.nucleo.notificaciones.contrato import NotificadorSimulado

AHORA = datetime(2026, 11, 26, 9, 0)
DNI = "70000001"  # ficticio


def _cita(minutos: int, estado: str = "registrada", recordada: bool = False) -> CitaRecordable:
    return CitaRecordable(id_cita=1, dni=DNI, inicio=AHORA + timedelta(minutes=minutos), estado=estado,
                          recordada=recordada)


# ---------- Ventana de 24 horas (CP-01 a CP-05) ----------

@pytest.mark.parametrize(
    ("minutos", "se_recuerda"),
    [
        pytest.param(1440, True, id="CP-01 justo 24 h (límite incluido)"),
        pytest.param(1441, False, id="CP-02 un minuto fuera de la ventana"),
        pytest.param(60, True, id="CP-03 dentro de la ventana"),
        pytest.param(0, False, id="CP-04 la cita empieza ahora"),
        pytest.param(-30, False, id="CP-05 la cita ya pasó"),
    ],
)
def test_ventana_de_24_horas(minutos, se_recuerda):
    assert bool(citas_a_recordar([_cita(minutos)], AHORA)) is se_recuerda


def test_cita_confirmada_tambien_se_recuerda():
    assert citas_a_recordar([_cita(300, estado="confirmada")], AHORA)


# ---------- Estado de la cita y del envío (CP-06 a CP-08) ----------

def test_cp06_cita_cancelada_no_se_recuerda():
    notificador = NotificadorSimulado()
    assert enviar_recordatorios([_cita(300, estado="cancelada")], AHORA, notificador) == []
    assert notificador.enviados == []


def test_cp07_cita_ya_recordada_no_se_repite():
    notificador = NotificadorSimulado()
    assert enviar_recordatorios([_cita(300, recordada=True)], AHORA, notificador) == []
    assert notificador.enviados == []


def test_cp08_si_el_envio_falla_la_cita_no_queda_recordada_y_se_reintenta():
    cita = _cita(300)
    assert enviar_recordatorios([cita], AHORA, NotificadorSimulado(falla=True)) == []
    assert cita.recordada is False

    notificador = NotificadorSimulado()  # en la siguiente pasada el envío funciona
    assert enviar_recordatorios([cita], AHORA, notificador) == [cita]
    assert cita.recordada is True


def test_envio_exitoso_usa_el_contrato_y_no_se_repite():
    cita = _cita(300)
    notificador = NotificadorSimulado()
    assert enviar_recordatorios([cita], AHORA, notificador) == [cita]
    assert enviar_recordatorios([cita], AHORA, notificador) == []  # segunda pasada: ya recordada

    [(dni, mensaje)] = notificador.enviados
    assert dni == DNI
    assert "26/11/2026" in mensaje and "14:00" in mensaje


# ---------- Reprogramar deja sin efecto el recordatorio anterior (CP-09) ----------

def test_cp09_reprogramar_anula_el_recordatorio_pendiente_anterior(cliente, db, agenda, agendar):
    from app.modulos.m2_agenda.modelos import Recordatorio

    cita = agendar("09:00")
    anterior = cita["recordatorio"]["id_recordatorio"]
    respuesta = cliente.put(
        f"/api/citas/{cita['id_cita']}/reprogramar",
        json={"fecha": agenda["fecha"], "hora": "10:00"},
        headers=agenda["recepcion"],
    )
    assert respuesta.status_code == 200, respuesta.text
    nuevo = respuesta.json()["recordatorio"]
    assert nuevo["id_recordatorio"] != anterior and nuevo["estado"] == "pendiente"
    assert db.get(Recordatorio, anterior).estado == "fallido"
