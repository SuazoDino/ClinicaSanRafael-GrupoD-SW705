"""Fixtures compartidas. Las pruebas usan una BD aparte (DATABASE_URL_PRUEBAS), que se
recrea con las migraciones al inicio; cada prueba se deshace al terminar (rollback)."""
import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

URL_PRUEBAS = os.environ.get(
    "DATABASE_URL_PRUEBAS", "postgresql+psycopg://sica:sica@localhost:5432/sica_pruebas"
)
os.environ["DATABASE_URL"] = URL_PRUEBAS  # la app y Alembic apuntan a la BD de pruebas

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.nucleo.autenticacion.modelos import Rol, Usuario  # noqa: E402
from app.nucleo.base_datos import obtener_sesion  # noqa: E402
from app.nucleo.seguridad import crear_token, hashear_clave  # noqa: E402

CARPETA_DB = Path(__file__).resolve().parents[1] / "db"


def _preparar_bd() -> None:
    url = make_url(URL_PRUEBAS)
    with create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT").connect() as cx:
        if not cx.scalar(text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": url.database}):
            cx.execute(text(f'CREATE DATABASE "{url.database}"'))
    with create_engine(url, isolation_level="AUTOCOMMIT").connect() as cx:
        cx.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public"))
    command.upgrade(Config(str(CARPETA_DB / "alembic.ini")), "head")


@pytest.fixture(scope="session")
def motor():
    _preparar_bd()
    motor = create_engine(URL_PRUEBAS)
    yield motor
    motor.dispose()


@pytest.fixture
def db(motor):
    """Sesión dentro de una transacción que se revierte al final de cada prueba."""
    conexion = motor.connect()
    transaccion = conexion.begin()
    sesion = Session(bind=conexion, join_transaction_mode="create_savepoint", expire_on_commit=False)
    yield sesion
    sesion.close()
    transaccion.rollback()
    conexion.close()


@pytest.fixture
def cliente(db):
    app.dependency_overrides[obtener_sesion] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def crear_usuario(db):
    """crear_usuario('recepcionista') → (usuario, cabeceras con token)."""

    def _crear(rol: str, username: str | None = None, clave: str = "Clave123!"):
        id_rol = db.query(Rol.id_rol).filter(Rol.nombre == rol).scalar()
        usuario = Usuario(username=username or f"prueba_{rol}", password_hash=hashear_clave(clave), id_rol=id_rol)
        db.add(usuario)
        db.flush()
        token = crear_token(usuario.id_usuario, rol)
        return usuario, {"Authorization": f"Bearer {token}"}

    return _crear


@pytest.fixture
def agenda(db, cliente, crear_usuario):
    """Médico con horario todos los días 08:00–13:00 (cupos de 20 min), un paciente, un CIE-10 y una
    recepcionista. `fecha` es mañana, así ningún cupo está «pasado»."""
    from datetime import timedelta

    from app.nucleo.tiempo import hoy

    medico_usuario, cabeceras_medico = crear_usuario("medico", username="dr_agenda")
    id_esp = db.scalar(text("INSERT INTO especialidad (nombre) VALUES ('Especialidad prueba') RETURNING id_especialidad"))
    id_medico = db.scalar(
        text(
            "INSERT INTO medico (nombres, apellidos, colegiatura, id_especialidad, id_usuario) "
            "VALUES ('Rosa', 'Prueba', 'CMP-AG1', :e, :u) RETURNING id_medico"
        ),
        {"e": id_esp, "u": medico_usuario.id_usuario},
    )
    db.execute(
        text(
            "INSERT INTO horario_medico (id_medico, dia_semana, hora_inicio, hora_fin) "
            "SELECT :m, d, '08:00', '13:00' FROM generate_series(1, 7) AS d"
        ),
        {"m": id_medico},
    )
    db.execute(text("INSERT INTO cie10 (codigo, descripcion) VALUES ('I20.9', 'Angina de pecho, no especificada'), "
                    "('E11', 'Diabetes mellitus tipo 2') ON CONFLICT DO NOTHING"))
    _, cabeceras_recepcion = crear_usuario("recepcionista")
    paciente = cliente.post(
        "/api/pacientes",
        json={"dni": "55556666", "nombres": "Luis", "apellidos": "Agenda Prueba", "fecha_nacimiento": "1980-03-01",
              "telefono": "+51911111111"},
        headers=cabeceras_recepcion,
    ).json()
    return {
        "id_medico": id_medico,
        "id_paciente": paciente["id_paciente"],
        "fecha": (hoy() + timedelta(days=1)).isoformat(),
        "recepcion": cabeceras_recepcion,
        "medico": cabeceras_medico,
    }


@pytest.fixture
def agendar(cliente, agenda):
    """agendar('09:00') → cita registrada (JSON) en la fecha de `agenda`."""

    def _agendar(hora: str, fecha: str | None = None):
        respuesta = cliente.post(
            "/api/citas",
            json={"id_paciente": agenda["id_paciente"], "id_medico": agenda["id_medico"],
                  "fecha": fecha or agenda["fecha"], "hora": hora},
            headers=agenda["recepcion"],
        )
        assert respuesta.status_code == 201, respuesta.text
        return respuesta.json()

    return _agendar
