"""Errores de negocio y su traducción a respuestas HTTP.

En los servicios basta con lanzar, por ejemplo, `raise Conflicto("El cupo ya está ocupado")`
y la API responde 409 con {"detalle": "..."}.
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError, IntegrityError


class ErrorNegocio(Exception):
    codigo_http = 400

    def __init__(self, detalle: str, **datos):
        super().__init__(detalle)
        self.detalle = detalle
        self.datos = datos  # información extra para el frontend, p. ej. id_paciente existente


class NoEncontrado(ErrorNegocio):
    codigo_http = 404


class Conflicto(ErrorNegocio):
    codigo_http = 409


class DatosInvalidos(ErrorNegocio):
    codigo_http = 422


class NoAutorizado(ErrorNegocio):
    codigo_http = 401


class Prohibido(ErrorNegocio):
    codigo_http = 403


def registrar_manejadores(app: FastAPI) -> None:
    @app.exception_handler(ErrorNegocio)
    async def _error_negocio(_: Request, exc: ErrorNegocio):
        return JSONResponse(status_code=exc.codigo_http, content={"detalle": exc.detalle, **exc.datos})

    @app.exception_handler(IntegrityError)
    async def _integridad(_: Request, exc: IntegrityError):
        # Índices únicos y CHECK de la BD (p. ej. ux_cita_cupo): el dato choca con uno existente
        restriccion = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        return JSONResponse(
            status_code=409,
            content={"detalle": "El registro entra en conflicto con datos existentes", "restriccion": restriccion},
        )

    @app.exception_handler(DBAPIError)
    async def _base_datos(_: Request, exc: DBAPIError):
        # Triggers de la BD (RAISE EXCEPTION → SQLSTATE P0001), p. ej. intento de DELETE en tablas clínicas
        if getattr(exc.orig, "sqlstate", None) == "P0001":
            return JSONResponse(status_code=409, content={"detalle": exc.orig.diag.message_primary})
        raise exc
