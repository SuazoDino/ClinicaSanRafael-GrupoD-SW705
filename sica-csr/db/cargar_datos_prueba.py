"""Carga datos ficticios para desarrollo y demostración. Se puede ejecutar varias veces.

    cd db && python cargar_datos_prueba.py

Usuarios creados (contraseña de todos: Sica2026!):
    admin (administrador), recepcion (recepcionista), enfermera (enfermera),
    medico y cardiologo (médicos, ver especialidades_medicos.csv)
"""
import csv
import sys
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
sys.path.insert(0, str(CARPETA.parent / "backend"))

from sqlalchemy import text  # noqa: E402

from app.nucleo.base_datos import motor  # noqa: E402
from app.nucleo.seguridad import hashear_clave  # noqa: E402

CLAVE_DEMO = "Sica2026!"
USUARIOS_BASE = [("admin", "administrador"), ("recepcion", "recepcionista"), ("enfermera", "enfermera")]


def _leer(nombre: str) -> list[dict]:
    with open(CARPETA / "datos_prueba" / nombre, encoding="utf-8") as archivo:
        return list(csv.DictReader(archivo))


def _crear_usuario(cx, username: str, rol: str, clave_hash: str) -> int:
    cx.execute(
        text(
            "INSERT INTO usuario (username, password_hash, id_rol) "
            "SELECT :u, :h, id_rol FROM rol WHERE nombre = :r ON CONFLICT (username) DO NOTHING"
        ),
        {"u": username, "h": clave_hash, "r": rol},
    )
    return cx.scalar(text("SELECT id_usuario FROM usuario WHERE username = :u"), {"u": username})


def main() -> None:
    clave_hash = hashear_clave(CLAVE_DEMO)
    with motor.begin() as cx:
        for username, rol in USUARIOS_BASE:
            _crear_usuario(cx, username, rol, clave_hash)

        cx.execute(
            text("INSERT INTO cie10 (codigo, descripcion) VALUES (:codigo, :descripcion) ON CONFLICT DO NOTHING"),
            _leer("cie10_catalogo.csv"),
        )

        for fila in _leer("especialidades_medicos.csv"):
            cx.execute(
                text("INSERT INTO especialidad (nombre) VALUES (:e) ON CONFLICT (nombre) DO NOTHING"),
                {"e": fila["especialidad"]},
            )
            id_usuario = _crear_usuario(cx, fila["usuario"], "medico", clave_hash) if fila["usuario"] else None
            id_medico = cx.scalar(
                text(
                    "INSERT INTO medico (nombres, apellidos, colegiatura, id_especialidad, id_usuario) "
                    "SELECT :n, :a, :c, id_especialidad, :u FROM especialidad WHERE nombre = :e "
                    "ON CONFLICT (colegiatura) DO NOTHING RETURNING id_medico"
                ),
                {"n": fila["nombres"], "a": fila["apellidos"], "c": fila["colegiatura"], "u": id_usuario,
                 "e": fila["especialidad"]},
            )
            if id_medico:  # médico nuevo: horario de lunes a viernes, 08:00–13:00, cupos de 20 min
                cx.execute(
                    text(
                        "INSERT INTO horario_medico (id_medico, dia_semana, hora_inicio, hora_fin) "
                        "SELECT :m, d, '08:00', '13:00' FROM generate_series(1, 5) AS d"
                    ),
                    {"m": id_medico},
                )

        for fila in _leer("pacientes_ficticios.csv"):
            id_paciente = cx.scalar(
                text(
                    "INSERT INTO paciente (dni, nombres, apellidos, telefono, email, fecha_nacimiento) "
                    "VALUES (:dni, :nombres, :apellidos, NULLIF(:telefono, ''), NULLIF(:email, ''), :fecha_nacimiento) "
                    "ON CONFLICT (dni) DO NOTHING RETURNING id_paciente"
                ),
                fila,
            )
            if id_paciente:
                cx.execute(text("INSERT INTO historia_clinica (id_paciente) VALUES (:p)"), {"p": id_paciente})

    print(f"Datos de prueba cargados. Usuarios: admin, recepcion, enfermera, medico, cardiologo (clave {CLAVE_DEMO})")


if __name__ == "__main__":
    main()
