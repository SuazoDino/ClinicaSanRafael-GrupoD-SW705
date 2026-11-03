"""Configuración de Alembic: usa la URL del .env y los modelos del backend."""
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine

from app import registro_modelos  # noqa: F401  (carga todas las tablas en Base.metadata)
from app.nucleo.base_datos import Base
from app.nucleo.config import obtener_configuracion

if context.config.config_file_name is not None:
    fileConfig(context.config.config_file_name)

# Permite apuntar a otra BD (p. ej. la de pruebas) con: DATABASE_URL=... alembic upgrade head
url = os.environ.get("DATABASE_URL") or obtener_configuracion().database_url


def run_migrations_offline() -> None:
    context.configure(url=url, target_metadata=Base.metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    motor = create_engine(url)
    with motor.connect() as conexion:
        context.configure(connection=conexion, target_metadata=Base.metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
