import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.autenticacion.esquemas import TokenSalida
from app.nucleo.autenticacion.modelos import Usuario
from app.nucleo.excepciones import NoAutorizado
from app.nucleo.seguridad import crear_token, decodificar_token, verificar_clave


def _emitir_tokens(usuario: Usuario) -> TokenSalida:
    return TokenSalida(
        access_token=crear_token(usuario.id_usuario, usuario.rol.nombre, "acceso"),
        refresh_token=crear_token(usuario.id_usuario, usuario.rol.nombre, "refresco"),
    )


def iniciar_sesion(db: Session, username: str, clave: str, ip: str | None) -> TokenSalida:
    usuario = db.scalar(select(Usuario).where(Usuario.username == username))
    if usuario is None or not usuario.activo or not verificar_clave(clave, usuario.password_hash):
        raise NoAutorizado("Usuario o contraseña incorrectos")
    Auditor(db, usuario.id_usuario, ip).registrar("INICIAR_SESION", "usuario", usuario.id_usuario)
    db.commit()
    return _emitir_tokens(usuario)


def refrescar(db: Session, refresh_token: str) -> TokenSalida:
    try:
        datos = decodificar_token(refresh_token)
    except jwt.PyJWTError:
        raise NoAutorizado("Sesión expirada, vuelva a iniciar sesión")
    usuario = db.get(Usuario, int(datos["sub"]))
    if datos.get("tipo") != "refresco" or usuario is None or not usuario.activo:
        raise NoAutorizado("Sesión expirada, vuelva a iniciar sesión")
    return _emitir_tokens(usuario)
