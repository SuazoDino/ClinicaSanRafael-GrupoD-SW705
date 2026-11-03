"""HU03 · Registrar paciente con DNI único."""
PACIENTE = {
    "dni": "45678912",
    "nombres": "Ana",
    "apellidos": "Prueba Ficticia",
    "fecha_nacimiento": "1990-05-10",
    "telefono": "+51999999999",
}


def test_registra_paciente_y_asigna_hce(cliente, crear_usuario):
    _, cabeceras = crear_usuario("recepcionista")
    respuesta = cliente.post("/api/pacientes", json=PACIENTE, headers=cabeceras)
    assert respuesta.status_code == 201
    assert respuesta.json()["numero_hce"].startswith("HCE-")


def test_dni_repetido_devuelve_paciente_existente(cliente, crear_usuario):
    _, cabeceras = crear_usuario("recepcionista")
    primero = cliente.post("/api/pacientes", json=PACIENTE, headers=cabeceras).json()
    repetido = cliente.post("/api/pacientes", json=PACIENTE, headers=cabeceras)
    assert repetido.status_code == 409
    assert repetido.json()["id_paciente"] == primero["id_paciente"]


def test_dni_invalido_es_rechazado(cliente, crear_usuario):
    _, cabeceras = crear_usuario("recepcionista")
    respuesta = cliente.post("/api/pacientes", json={**PACIENTE, "dni": "123"}, headers=cabeceras)
    assert respuesta.status_code == 422


def test_busqueda_por_dni(cliente, crear_usuario):
    _, cabeceras = crear_usuario("recepcionista")
    cliente.post("/api/pacientes", json=PACIENTE, headers=cabeceras)
    resultados = cliente.get("/api/pacientes", params={"texto": PACIENTE["dni"]}, headers=cabeceras).json()
    assert [p["dni"] for p in resultados] == [PACIENTE["dni"]]
