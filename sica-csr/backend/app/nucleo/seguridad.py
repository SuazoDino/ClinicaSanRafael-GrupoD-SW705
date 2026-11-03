"""Hash de contraseñas (argon2) y tokens JWT."""
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError

from app.nucleo.config import obtener_configuracion

_hasher = PasswordHasher()


def hashear_clave(clave: str) -> str:
    return _hasher.hash(clave)


def verificar_clave(clave: str, clave_hash: str) -> bool:
    try:
        return _hasher.verify(clave_hash, clave)
    except VerificationError:
        return False


def crear_token(id_usuario: int, rol: str, tipo: str = "acceso") -> str:
    config = obtener_configuracion()
    minutos = config.jwt_expire_minutes if tipo == "acceso" else config.jwt_refresh_expire_minutes
    datos = {
        "sub": str(id_usuario),
        "rol": rol,
        "tipo": tipo,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutos),
    }
    return jwt.encode(datos, config.jwt_secret, algorithm=config.jwt_algorithm)


def decodificar_token(token: str) -> dict:
    """Lanza jwt.PyJWTError si el token es inválido o expiró."""
    config = obtener_configuracion()
    return jwt.decode(token, config.jwt_secret, algorithms=[config.jwt_algorithm])
