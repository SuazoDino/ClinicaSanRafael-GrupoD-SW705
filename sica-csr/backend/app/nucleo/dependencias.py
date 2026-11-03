"""Dependencias reutilizables en las rutas (equivalente a los middleware de Laravel).

Uso típico en una ruta:

    @router.post("", dependencies=[requiere_roles("recepcionista")])
    def crear(datos: PacienteCrear, db: Sesion, auditor: AuditorActual): ...
"""
from typing import Annotated

import jwt
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.autenticacion.modelos import Usuario
from app.nucleo.base_datos import obtener_sesion
from app.nucleo.excepciones import NoAutorizado, Prohibido
from app.nucleo.seguridad import decodificar_token

_esquema_oauth = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

Sesion = Annotated[Session, Depends(obtener_sesion)]


def obtener_usuario_actual(db: Sesion, token: Annotated[str, Depends(_esquema_oauth)]) -> Usuario:
    try:
        datos = decodificar_token(token)
    except jwt.PyJWTError:
        raise NoAutorizado("Sesión inválida o expirada")
    if datos.get("tipo") != "acceso":
        raise NoAutorizado("Token no válido para esta operación")
    usuario = db.get(Usuario, int(datos["sub"]))
    if usuario is None or not usuario.activo:
        raise NoAutorizado("Usuario inactivo o inexistente")
    return usuario


UsuarioActual = Annotated[Usuario, Depends(obtener_usuario_actual)]


def requiere_roles(*roles: str):
    """Permite el acceso solo a los roles indicados. El rol 'administrador' siempre pasa."""

    def _verificar(usuario: UsuarioActual) -> Usuario:
        if usuario.rol.nombre != "administrador" and usuario.rol.nombre not in roles:
            raise Prohibido("Su rol no tiene permiso para esta operación")
        return usuario

    return Depends(_verificar)


def obtener_auditor(db: Sesion, usuario: UsuarioActual, request: Request) -> Auditor:
    ip = request.client.host if request.client else None
    return Auditor(db, usuario.id_usuario, ip)


AuditorActual = Annotated[Auditor, Depends(obtener_auditor)]
