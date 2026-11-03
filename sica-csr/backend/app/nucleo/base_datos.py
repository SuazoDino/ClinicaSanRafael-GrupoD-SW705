"""Conexión a PostgreSQL y clase base de todos los modelos."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.nucleo.config import obtener_configuracion

motor = create_engine(obtener_configuracion().database_url, pool_pre_ping=True)
FabricaSesiones = sessionmaker(bind=motor, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Todos los modelos heredan de esta clase."""


def obtener_sesion() -> Iterator[Session]:
    """Abre una sesión por petición. Los servicios hacen commit; si algo falla, se revierte."""
    sesion = FabricaSesiones()
    try:
        yield sesion
    except Exception:
        sesion.rollback()
        raise
    finally:
        sesion.close()
