"""Tipos de texto para los esquemas con mensajes pensados para el usuario (el frontend los muestra tal cual)."""
from typing import Annotated

from pydantic import AfterValidator
from pydantic_core import PydanticCustomError


def texto_obligatorio(mensaje: str, maximo: int):
    """Texto sin espacios sobrantes, no vacío y de `maximo` caracteres como mucho."""

    def _validar(valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise PydanticCustomError("texto_obligatorio", mensaje)
        if len(valor) > maximo:
            raise PydanticCustomError("texto_largo", "El texto no puede superar {maximo} caracteres.", {"maximo": maximo})
        return valor

    return Annotated[str, AfterValidator(_validar)]


def _vacio_a_nulo(valor: str | None) -> str | None:
    if valor is None:
        return None
    return valor.strip() or None


TextoOpcional = Annotated[str | None, AfterValidator(_vacio_a_nulo)]
