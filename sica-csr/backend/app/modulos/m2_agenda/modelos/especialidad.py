from sqlalchemy import Identity, String
from sqlalchemy.orm import Mapped, mapped_column

from app.nucleo.base_datos import Base


class Especialidad(Base):
    __tablename__ = "especialidad"

    id_especialidad: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True)
