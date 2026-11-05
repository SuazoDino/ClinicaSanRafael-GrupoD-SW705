"""Fecha y hora local de la clínica (la BD y los contenedores corren en UTC)."""
from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.nucleo.config import obtener_configuracion


def ahora() -> datetime:
    """Hora local sin zona (las columnas TIMESTAMP de la BD no guardan zona)."""
    zona = ZoneInfo(obtener_configuracion().zona_horaria)
    return datetime.now(zona).replace(tzinfo=None, microsecond=0)


def hoy() -> date:
    return ahora().date()
