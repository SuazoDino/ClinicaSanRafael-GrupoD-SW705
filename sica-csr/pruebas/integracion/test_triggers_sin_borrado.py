"""RFN04 · Las tablas clínicas no permiten DELETE (trigger fn_bloquear_borrado)."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

TABLAS_CLINICAS = ["paciente", "historia_clinica", "cita", "triaje", "consulta_medica", "diagnostico_consulta", "receta"]


def test_delete_de_paciente_es_rechazado(db):
    db.execute(text(
        "INSERT INTO paciente (dni, nombres, apellidos, fecha_nacimiento) VALUES ('33334444', 'P', 'Q', '1990-01-01')"))
    with pytest.raises(DBAPIError, match="RFN04"), db.begin_nested():
        db.execute(text("DELETE FROM paciente WHERE dni = '33334444'"))


@pytest.mark.parametrize("tabla", TABLAS_CLINICAS)
def test_tabla_clinica_tiene_trigger_sin_borrado(db, tabla):
    existe = db.scalar(text(
        "SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid "
        "WHERE c.relname = :t AND t.tgname LIKE 'trg_no_delete_%'"), {"t": tabla})
    assert existe, f"Falta el trigger sin borrado en {tabla}"
