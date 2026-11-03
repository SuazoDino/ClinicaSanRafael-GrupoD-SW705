"""Tarea programada que revisa los recordatorios pendientes cada N minutos (HU09).

Se activa con RECORDATORIOS_ACTIVOS=true en el .env; main.py la inicia y la detiene.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.modulos.m2_agenda.servicios import recordatorio_servicio
from app.nucleo.base_datos import FabricaSesiones
from app.nucleo.config import obtener_configuracion

log = logging.getLogger("recordatorios")
_programador: BackgroundScheduler | None = None


def _ejecutar() -> None:
    with FabricaSesiones() as db:
        procesados = recordatorio_servicio.procesar_pendientes(db)
        if procesados:
            log.info("Recordatorios procesados: %s", procesados)


def iniciar() -> None:
    global _programador
    config = obtener_configuracion()
    if not config.recordatorios_activos or _programador is not None:
        return
    _programador = BackgroundScheduler(timezone="America/Lima")
    _programador.add_job(_ejecutar, "interval", minutes=config.recordatorios_intervalo_min, id="recordatorios")
    _programador.start()


def detener() -> None:
    global _programador
    if _programador is not None:
        _programador.shutdown(wait=False)
        _programador = None
