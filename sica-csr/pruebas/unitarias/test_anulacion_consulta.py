"""HU12 · Anulación de consultas con motivo, usuario y fecha. La consulta anulada sigue visible en la HCE."""
from sqlalchemy import select

from app.nucleo.auditoria.modelos import Bitacora


def _consulta_atendida(cliente, agenda, agendar):
    cita = agendar("08:00")
    cliente.put(f"/api/citas/{cita['id_cita']}/asistencia", json={"asistio": True}, headers=agenda["recepcion"])
    respuesta = cliente.post(
        "/api/consultas",
        json={"id_cita": cita["id_cita"], "motivo": "Control", "diagnosticos": [{"codigo_cie10": "E11", "es_principal": True}]},
        headers=agenda["medico"],
    )
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def test_anular_consulta_requiere_motivo(cliente, agenda, agendar):
    consulta = _consulta_atendida(cliente, agenda, agendar)
    url = f"/api/consultas/{consulta['id_consulta']}/anular"
    assert cliente.put(url, json={"motivo": ""}, headers=agenda["medico"]).status_code == 422


def test_anulada_conserva_quien_cuando_y_por_que(cliente, agenda, agendar, db):
    consulta = _consulta_atendida(cliente, agenda, agendar)
    url = f"/api/consultas/{consulta['id_consulta']}/anular"
    anulada = cliente.put(url, json={"motivo": "Registrada en el paciente equivocado"}, headers=agenda["medico"]).json()
    assert anulada["anulada"] is True
    assert anulada["anulada_por"] is not None and anulada["fecha_anulacion"] is not None

    assert cliente.put(url, json={"motivo": "Otra vez"}, headers=agenda["medico"]).status_code == 409

    hce = cliente.get(f"/api/historias/{agenda['id_paciente']}", headers=agenda["medico"]).json()
    entrada = next(c for c in hce["consultas"] if c["id_consulta"] == consulta["id_consulta"])
    assert entrada["anulada"] is True
    assert entrada["anulada_por_usuario"] == "dr_agenda"

    assert db.scalar(select(Bitacora).where(Bitacora.accion == "ANULAR", Bitacora.id_entidad == consulta["id_consulta"]))
