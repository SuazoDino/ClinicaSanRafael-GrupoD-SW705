"""Importa todos los modelos para que SQLAlchemy y Alembic conozcan todas las tablas.

Si creas un módulo nuevo (p. ej. m3_laboratorio), agrega aquí su paquete de modelos.
"""
from app.nucleo.auditoria import modelos as _auditoria  # noqa: F401
from app.nucleo.autenticacion import modelos as _autenticacion  # noqa: F401
from app.modulos.m1_hce import modelos as _m1  # noqa: F401
from app.modulos.m2_agenda import modelos as _m2  # noqa: F401
