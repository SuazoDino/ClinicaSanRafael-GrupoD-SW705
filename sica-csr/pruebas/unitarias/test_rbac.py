"""RFN01 · Acceso por rol con JWT."""
from test_paciente_dni_unico import PACIENTE


def test_sin_token_responde_401(cliente):
    assert cliente.get("/api/pacientes", params={"texto": "ana"}).status_code == 401


def test_rol_sin_permiso_responde_403(cliente, crear_usuario):
    _, cabeceras = crear_usuario("enfermera")
    assert cliente.post("/api/pacientes", json=PACIENTE, headers=cabeceras).status_code == 403


def test_administrador_tiene_acceso_a_todo(cliente, crear_usuario):
    _, cabeceras = crear_usuario("administrador")
    assert cliente.post("/api/pacientes", json=PACIENTE, headers=cabeceras).status_code == 201


def test_login_correcto_e_incorrecto(cliente, crear_usuario):
    crear_usuario("medico", username="dr_prueba", clave="Clave123!")
    ok = cliente.post("/api/auth/login", data={"username": "dr_prueba", "password": "Clave123!"})
    assert ok.status_code == 200
    yo = cliente.get("/api/auth/yo", headers={"Authorization": f"Bearer {ok.json()['access_token']}"})
    assert yo.json()["rol"] == "medico"

    mal = cliente.post("/api/auth/login", data={"username": "dr_prueba", "password": "otra"})
    assert mal.status_code == 401
