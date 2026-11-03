"""Prueba de carga (RFN02: HCE en <2 s, percentil 95, con 8 000 pacientes).

    python pruebas/rendimiento/generar_datos_carga.py
    locust -f pruebas/rendimiento/locustfile.py --host http://localhost:8000
"""
import random

from locust import HttpUser, between, task


class PersonalClinico(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        respuesta = self.client.post("/api/auth/login", data={"username": "admin", "password": "Sica2026!"})
        self.client.headers["Authorization"] = f"Bearer {respuesta.json()['access_token']}"

    @task(3)
    def buscar_paciente_por_dni(self):
        dni = str(80000000 + random.randint(1, 8000))
        self.client.get("/api/pacientes", params={"texto": dni}, name="/api/pacientes?texto=[dni]")

    # Pendiente HU04: cuando exista GET /api/historias/{id_paciente}, medir aquí la apertura de la HCE
