"""Filtros de la Agenda de citas: paciente, especialidad, médico y fecha se combinan; los días dependen del médico."""
from datetime import date, timedelta

from sqlalchemy import text


def _otro_medico(db, dia_semana: int) -> tuple[int, int]:
    """Médico de otra especialidad que atiende un solo día de la semana."""
    id_esp = db.scalar(text("INSERT INTO especialidad (nombre) VALUES ('Otra especialidad') RETURNING id_especialidad"))
    id_medico = db.scalar(
        text("INSERT INTO medico (nombres, apellidos, colegiatura, id_especialidad) "
             "VALUES ('Ana', 'Filtro', 'CMP-FL1', :e) RETURNING id_medico"),
        {"e": id_esp},
    )
    db.execute(text("INSERT INTO horario_medico (id_medico, dia_semana, hora_inicio, hora_fin) "
                    "VALUES (:m, :d, '08:00', '12:00')"), {"m": id_medico, "d": dia_semana})
    return id_esp, id_medico


def test_filtros_se_combinan(cliente, db, agenda, agendar):
    recepcion, fecha = agenda["recepcion"], agenda["fecha"]
    id_esp_otra, id_medico_otro = _otro_medico(db, date.fromisoformat(fecha).isoweekday())
    otro_paciente = cliente.post(
        "/api/pacientes",
        json={"dni": "55557777", "nombres": "Rita", "apellidos": "Filtro Prueba", "fecha_nacimiento": "1990-05-01"},
        headers=recepcion,
    ).json()

    agendar("08:00")  # paciente de agenda con el médico de agenda
    cliente.post("/api/citas", json={"id_paciente": otro_paciente["id_paciente"], "id_medico": id_medico_otro,
                                     "fecha": fecha, "hora": "08:00"}, headers=recepcion)
    cliente.post("/api/citas", json={"id_paciente": otro_paciente["id_paciente"], "id_medico": agenda["id_medico"],
                                     "fecha": fecha, "hora": "08:20"}, headers=recepcion)

    def contar(**filtros):
        r = cliente.get("/api/citas", params={"fecha": fecha, **filtros}, headers=recepcion)
        assert r.status_code == 200, r.text
        return len(r.json())

    assert contar() == 3
    assert contar(id_especialidad=id_esp_otra) == 1
    assert contar(id_paciente=otro_paciente["id_paciente"]) == 2
    assert contar(id_paciente=otro_paciente["id_paciente"], id_especialidad=id_esp_otra) == 1
    assert contar(id_paciente=agenda["id_paciente"], id_medico=id_medico_otro) == 0


def test_dias_segun_medico(cliente, db, agenda):
    manana = date.fromisoformat(agenda["fecha"])
    _, id_medico = _otro_medico(db, manana.isoweekday())
    dias = cliente.get("/api/disponibilidad/dias", params={"desde": agenda["fecha"], "id_medico": id_medico, "cantidad": 3},
                       headers=agenda["recepcion"]).json()
    assert dias == [(manana + timedelta(weeks=s)).isoformat() for s in range(3)]
