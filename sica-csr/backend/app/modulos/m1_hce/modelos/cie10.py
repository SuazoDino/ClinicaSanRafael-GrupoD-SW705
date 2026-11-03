from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.nucleo.base_datos import Base


class Cie10(Base):
    __tablename__ = "cie10"

    codigo: Mapped[str] = mapped_column(String(8), primary_key=True)
    descripcion: Mapped[str] = mapped_column(String(200))
