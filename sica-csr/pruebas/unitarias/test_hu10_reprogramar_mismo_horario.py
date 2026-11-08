"""HU10 · Reprogramar o cancelar cita (RF10): reglas al reprogramar."""
from sqlalchemy import text


def _marcar_atendida(db, id_cita: int) -> None:
    db.execute(text("UPDATE cita SET estado = 'atendida' WHERE id_cita = :c"), {"c": id_cita})


def test_no_se_reprograma_una_cita_atendida(cliente, db, agenda, agendar):
    cita = agendar("09:00")
    _marcar_atendida(db, cita["id_cita"])
    respuesta = cliente.put(
        f"/api/citas/{cita['id_cita']}/reprogramar",
        json={"fecha": agenda["fecha"], "hora": "10:00"},
        headers=agenda["recepcion"],
    )
    assert respuesta.status_code == 409


def test_no_se_reprograma_al_mismo_horario(cliente, agenda, agendar):
    cita = agendar("09:00")
    respuesta = cliente.put(
        f"/api/citas/{cita['id_cita']}/reprogramar",
        json={"fecha": agenda["fecha"], "hora": "09:00"},
        headers=agenda["recepcion"],
    )
    assert respuesta.status_code == 422