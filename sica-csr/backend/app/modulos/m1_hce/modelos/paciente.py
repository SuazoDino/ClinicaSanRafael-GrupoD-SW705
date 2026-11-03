from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import CHAR, Identity, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base

if TYPE_CHECKING:
    from app.modulos.m1_hce.modelos.historia_clinica import HistoriaClinica


class Paciente(Base):
    __tablename__ = "paciente"

    id_paciente: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    dni: Mapped[str] = mapped_column(CHAR(8), unique=True)
    nombres: Mapped[str] = mapped_column(String(80))
    apellidos: Mapped[str] = mapped_column(String(80))
    telefono: Mapped[str | None] = mapped_column(String(15))
    email: Mapped[str | None] = mapped_column(String(100))
    fecha_nacimiento: Mapped[date]

    historia: Mapped["HistoriaClinica"] = relationship(back_populates="paciente", uselist=False)
