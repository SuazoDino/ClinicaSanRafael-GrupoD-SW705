from pydantic import BaseModel


class TokenSalida(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefrescarEntrada(BaseModel):
    refresh_token: str


class UsuarioSalida(BaseModel):
    id_usuario: int
    username: str
    rol: str
    id_medico: int | None = None
