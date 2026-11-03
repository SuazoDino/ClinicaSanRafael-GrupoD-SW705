"""Genera 8 000 pacientes ficticios con su HCE para la prueba de carga (RFN02).

    python pruebas/rendimiento/generar_datos_carga.py

Usa DATABASE_URL del .env. Los DNI empiezan en 80000000 para no chocar con los datos de prueba.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from sqlalchemy import text  # noqa: E402

from app.nucleo.base_datos import motor  # noqa: E402

TOTAL = 8000

with motor.begin() as cx:
    cx.execute(
        text(
            "INSERT INTO paciente (dni, nombres, apellidos, telefono, fecha_nacimiento) "
            "SELECT (80000000 + n)::TEXT, 'Paciente' || n, 'Carga Ficticia', '+5190' || LPAD(n::TEXT, 7, '0'), "
            "       DATE '1950-01-01' + (n * 3 % 25000) "
            "FROM generate_series(1, :total) AS n ON CONFLICT (dni) DO NOTHING"
        ),
        {"total": TOTAL},
    )
    creadas = cx.execute(
        text(
            "INSERT INTO historia_clinica (id_paciente) "
            "SELECT p.id_paciente FROM paciente p LEFT JOIN historia_clinica h USING (id_paciente) "
            "WHERE h.id_historia IS NULL"
        )
    ).rowcount
    total = cx.scalar(text("SELECT count(*) FROM paciente"))

print(f"Pacientes en la BD: {total} (HCE nuevas: {creadas})")
