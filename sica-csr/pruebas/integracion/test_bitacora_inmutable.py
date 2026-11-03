"""RFN01 · Toda operación queda en la bitácora y la bitácora no se puede modificar."""
import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError

from app.nucleo.auditoria.modelos import Bitacora
from test_paciente_dni_unico import PACIENTE


def test_registrar_paciente_queda_en_bitacora(cliente, crear_usuario, db):
    usuario, cabeceras = crear_usuario("recepcionista")
    id_paciente = cliente.post("/api/pacientes", json=PACIENTE, headers=cabeceras).json()["id_paciente"]
    registro = db.scalar(select(Bitacora).where(Bitacora.entidad == "paciente", Bitacora.id_entidad == id_paciente))
    assert registro.accion == "CREAR"
    assert registro.id_usuario == usuario.id_usuario


@pytest.mark.parametrize("sentencia", ["UPDATE bitacora SET accion = 'X'", "DELETE FROM bitacora"])
def test_bitacora_no_se_modifica(db, crear_usuario, sentencia):
    usuario, _ = crear_usuario("recepcionista")
    db.add(Bitacora(id_usuario=usuario.id_usuario, accion="PRUEBA", entidad="prueba"))
    db.flush()
    with pytest.raises(DBAPIError, match="RFN04"), db.begin_nested():
        db.execute(text(sentencia))
