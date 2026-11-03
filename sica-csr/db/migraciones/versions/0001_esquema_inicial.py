"""Esquema inicial del Sprint 1 (tablas, índices, triggers y roles).

Revision ID: 0001
Revises:
"""
from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

ARCHIVO_SQL = Path(__file__).resolve().parents[2] / "sql" / "sica_esquema_datos.sql"


def upgrade() -> None:
    # Cursor del driver sin parámetros: así los '%' del RAISE EXCEPTION llegan tal cual a PostgreSQL
    with op.get_bind().connection.cursor() as cursor:
        cursor.execute(ARCHIVO_SQL.read_text(encoding="utf-8"))


TABLAS = (
    "receta", "diagnostico_consulta", "cie10", "consulta_medica", "triaje", "recordatorio", "cita",
    "historia_clinica", "paciente", "horario_medico", "medico", "especialidad", "bitacora", "usuario", "rol",
)


def downgrade() -> None:
    for tabla in TABLAS:
        op.execute(f"DROP TABLE IF EXISTS {tabla} CASCADE")
    op.execute("DROP SEQUENCE IF EXISTS seq_numero_hce")
    op.execute("DROP FUNCTION IF EXISTS fn_bloquear_borrado")
