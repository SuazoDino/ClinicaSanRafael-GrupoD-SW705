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


@pytest.mark.skip(reason="Pendiente HU02: probar POST /api/citas → 409")
def test_api_responde_409_con_cupo_ocupado():
    pass
