from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import registro_modelos  # noqa: F401  (registra todas las tablas)
from app.api.rutas import router_api
from app.modulos.m2_agenda.servicios import recordatorio_programador
from app.nucleo.config import obtener_configuracion
from app.nucleo.excepciones import registrar_manejadores


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    recordatorio_programador.iniciar()
    yield
    recordatorio_programador.detener()


app = FastAPI(title="SICA-CSR", description="Sistema de Información Clínico-Administrativo", lifespan=ciclo_de_vida)

app.add_middleware(
    CORSMiddleware,
    allow_origins=obtener_configuracion().lista_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
registrar_manejadores(app)
app.include_router(router_api)


@app.get("/health", tags=["Sistema"])
def health():
    return {"estado": "ok"}
