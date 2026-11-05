"""HU02 · La BD rechaza dos citas vigentes en el mismo cupo (índice ux_cita_cupo)."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError


@pytest.fixture
def cita_base(db):
    id_esp = db.scalar(text("INSERT INTO especialidad (nombre) VALUES ('Prueba') RETURNING id_especialidad"))
    id_med = db.scalar(text(
        "INSERT INTO medico (nombres, apellidos, colegiatura, id_especialidad) "
        "VALUES ('Dr', 'Prueba', 'CMP-T1', :e) RETURNING id_medico"), {"e": id_esp})
    id_pac = db.scalar(text(
        "INSERT INTO paciente (dni, nombres, apellidos, fecha_nacimiento) "
        "VALUES ('11112222', 'P', 'Prueba', '1990-01-01') RETURNING id_paciente"))
    return {"p": id_pac, "m": id_med}


INSERTAR_CITA = "INSERT INTO cita (id_paciente, id_medico, fecha, hora, estado, motivo_cancelacion) " \
                "VALUES (:p, :m, '2030-01-07', '09:00', :estado, :motivo)"


def test_cupo_ocupado_es_rechazado(db, cita_base):
    db.execute(text(INSERTAR_CITA), {**cita_base, "estado": "registrada", "motivo": None})
    with pytest.raises(IntegrityError, match="ux_cita_cupo"), db.begin_nested():
        db.execute(text(INSERTAR_CITA), {**cita_base, "estado": "registrada", "motivo": None})


def test_cupo_cancelado_se_puede_reasignar(db, cita_base):
    db.execute(text(INSERTAR_CITA), {**cita_base, "estado": "cancelada", "motivo": "Paciente viaja"})
    db.execute(text(INSERTAR_CITA), {**cita_base, "estado": "registrada", "motivo": None})


def test_api_responde_409_con_cupo_ocupado(cliente, agenda, agendar):
    agendar("09:00")
    repetida = cliente.post(
        "/api/citas",
        json={"id_paciente": agenda["id_paciente"], "id_medico": agenda["id_medico"], "fecha": agenda["fecha"],
              "hora": "09:00"},
        headers=agenda["recepcion"],
    )
    assert repetida.status_code == 409
    assert repetida.json()["detalle"] == "Ese cupo acaba de ser tomado. Elige otro horario."


def test_cupos_marcan_ocupado_y_libre(cliente, agenda, agendar):
    agendar("09:00")
    cupos = cliente.get("/api/disponibilidad", params={"id_medico": agenda["id_medico"], "fecha": agenda["fecha"]},
                        headers=agenda["recepcion"]).json()
    assert len(cupos) == 15  # 08:00–13:00 en pasos de 20 min
    estados = {c["hora"]: c["estado"] for c in cupos}
    assert estados["09:00:00"] == "ocupado"
    assert estados["09:20:00"] == "libre"


def test_hora_fuera_del_horario_es_rechazada(cliente, agenda):
    respuesta = cliente.post(
        "/api/citas",
        json={"id_paciente": agenda["id_paciente"], "id_medico": agenda["id_medico"], "fecha": agenda["fecha"],
              "hora": "09:10"},
        headers=agenda["recepcion"],
    )
    assert respuesta.status_code == 409


def test_cancelar_libera_el_cupo_y_exige_motivo(cliente, agenda, agendar):
    cita = agendar("10:00")
    sin_motivo = cliente.put(f"/api/citas/{cita['id_cita']}/cancelar", json={"motivo": "  "}, headers=agenda["recepcion"])
    assert sin_motivo.status_code == 422
    cancelada = cliente.put(f"/api/citas/{cita['id_cita']}/cancelar", json={"motivo": "Paciente viaja"},
                            headers=agenda["recepcion"])
    assert cancelada.json()["estado"] == "cancelada"
    assert agendar("10:00")["estado"] == "registrada"


def test_reprogramar_cambia_el_cupo_y_programa_recordatorio(cliente, agenda, agendar):
    cita = agendar("11:00")
    nueva = cliente.put(f"/api/citas/{cita['id_cita']}/reprogramar", json={"fecha": agenda["fecha"], "hora": "12:00"},
                        headers=agenda["recepcion"])
    assert nueva.status_code == 200
    assert nueva.json()["hora"] == "12:00:00"
    assert nueva.json()["recordatorio"]["fecha_programada"].endswith("T12:00:00")
    assert agendar("11:00")["estado"] == "registrada"  # el cupo anterior quedó libre
