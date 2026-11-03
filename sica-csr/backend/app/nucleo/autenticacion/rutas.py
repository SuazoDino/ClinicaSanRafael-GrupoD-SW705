from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text

from app.nucleo.autenticacion import servicio
from app.nucleo.autenticacion.esquemas import RefrescarEntrada, TokenSalida, UsuarioSalida
from app.nucleo.dependencias import Sesion, UsuarioActual

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenSalida)
def login(formulario: Annotated[OAuth2PasswordRequestForm, Depends()], db: Sesion, request: Request):
    ip = request.client.host if request.client else None
    return servicio.iniciar_sesion(db, formulario.username, formulario.password, ip)


@router.post("/refrescar", response_model=TokenSalida)
def refrescar(datos: RefrescarEntrada, db: Sesion):
    return servicio.refrescar(db, datos.refresh_token)


@router.get("/yo", response_model=UsuarioSalida)
def yo(usuario: UsuarioActual, db: Sesion):
    # El núcleo no importa módulos: el médico vinculado se consulta por SQL directo
    id_medico = db.scalar(text("SELECT id_medico FROM medico WHERE id_usuario = :u"), {"u": usuario.id_usuario})
    return UsuarioSalida(
        id_usuario=usuario.id_usuario, username=usuario.username, rol=usuario.rol.nombre, id_medico=id_medico
    )
