from sqlalchemy import ForeignKey, Identity, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base


class Rol(Base):
    __tablename__ = "rol"

    id_rol: Mapped[int] = mapped_column(SmallInteger, Identity(always=True), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True)


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    id_rol: Mapped[int] = mapped_column(SmallInteger, ForeignKey("rol.id_rol"))
    activo: Mapped[bool] = mapped_column(default=True)

    rol: Mapped[Rol] = relationship(lazy="joined")
