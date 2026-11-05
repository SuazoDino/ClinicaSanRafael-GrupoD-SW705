"""Flujo completo: registrar paciente → agendar → asistencia → triaje → consulta con CIE-10 → receta → HCE."""


def test_flujo_completo(cliente, agenda, crear_usuario):
    recepcion, medico = agenda["recepcion"], agenda["medico"]
    _, enfermera = crear_usuario("enfermera")

    # HU01 · cupos y días con atención
    dias = cliente.get("/api/disponibilidad/dias", params={"desde": agenda["fecha"], "cantidad": 3}, headers=recepcion)
    assert dias.json()[0] == agenda["fecha"]
    cupos = cliente.get("/api/disponibilidad", params={"id_medico": agenda["id_medico"], "fecha": agenda["fecha"]},
                        headers=recepcion).json()
    hora = next(c["hora"] for c in cupos if c["estado"] == "libre")

    # HU02 · registrar cita
    cita = cliente.post("/api/citas", json={"id_paciente": agenda["id_paciente"], "id_medico": agenda["id_medico"],
                                            "fecha": agenda["fecha"], "hora": hora}, headers=recepcion).json()
    assert cita["estado"] == "registrada"
    assert cita["paciente"]["numero_hce"].startswith("HCE-")
    assert cita["medico"]["especialidad"] == "Especialidad prueba"
    assert cita["recordatorio"]["estado"] == "pendiente"
    id_cita = cita["id_cita"]

    # HU11 · sin asistencia no hay triaje
    signos = {"id_cita": id_cita, "presion_sistolica": 120, "presion_diastolica": 80, "frecuencia_cardiaca": 72,
              "temperatura": 36.5, "peso_kg": 70, "talla_cm": 168}
    assert cliente.post("/api/triajes", json=signos, headers=enfermera).status_code == 409

    # HU07 · asistencia
    confirmada = cliente.put(f"/api/citas/{id_cita}/asistencia", json={"asistio": True}, headers=recepcion).json()
    assert confirmada["estado"] == "confirmada"
    assert cliente.put(f"/api/citas/{id_cita}/asistencia", json={"asistio": True}, headers=recepcion).status_code == 409

    # HU11 · triaje
    pendientes = cliente.get("/api/triajes/pendientes", params={"fecha": agenda["fecha"]}, headers=enfermera).json()
    assert [c["id_cita"] for c in pendientes] == [id_cita]
    fuera = cliente.post("/api/triajes", json={**signos, "temperatura": 50}, headers=enfermera)
    assert fuera.status_code == 422
    assert "temperatura" in fuera.json()["detail"][0]["msg"]
    triaje = cliente.post("/api/triajes", json=signos, headers=enfermera)
    assert triaje.status_code == 201
    assert triaje.json()["temperatura"] == 36.5
    assert cliente.post("/api/triajes", json=signos, headers=enfermera).status_code == 409

    # HU08 · agenda del médico
    agenda_dia = cliente.get("/api/agenda-medico", params={"fecha": agenda["fecha"]}, headers=medico).json()
    assert agenda_dia[0]["estado"] == "triada"
    assert agenda_dia[0]["triaje"]["frecuencia_cardiaca"] == 72

    # HU05 · CIE-10 y consulta con receta
    assert cliente.get("/api/cie10", params={"texto": "angina"}, headers=medico).json()[0]["codigo"] == "I20.9"
    dos_principales = cliente.post("/api/consultas", json={
        "id_cita": id_cita, "motivo": "Dolor torácico",
        "diagnosticos": [{"codigo_cie10": "I20.9", "es_principal": True}, {"codigo_cie10": "E11", "es_principal": True}],
    }, headers=medico)
    assert dos_principales.status_code == 422
    consulta = cliente.post("/api/consultas", json={
        "id_cita": id_cita, "motivo": "Dolor torácico", "evolucion": "Estable",
        "diagnosticos": [{"codigo_cie10": "E11", "es_principal": False}, {"codigo_cie10": "I20.9", "es_principal": True}],
        "indicaciones": "Ácido acetilsalicílico 100 mg cada 24 h",
    }, headers=medico)
    assert consulta.status_code == 201, consulta.text

    # HU04 · HCE unificada
    hce = cliente.get(f"/api/historias/{agenda['id_paciente']}", headers=medico).json()
    assert hce["triaje_reciente"]["presion_sistolica"] == 120
    entrada = hce["consultas"][0]
    assert entrada["medico"]["id_medico"] == agenda["id_medico"]
    assert [d["codigo_cie10"] for d in entrada["diagnosticos"]] == ["I20.9", "E11"]  # principal primero
    assert entrada["receta"]["indicaciones"].startswith("Ácido")

    cita_final = cliente.get("/api/citas", params={"id_paciente": agenda["id_paciente"]}, headers=recepcion).json()
    assert cita_final[0]["estado"] == "atendida"
