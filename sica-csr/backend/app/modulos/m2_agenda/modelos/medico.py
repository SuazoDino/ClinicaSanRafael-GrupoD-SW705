from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Identity, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base

if TYPE_CHECKING:
    from app.modulos.m2_agenda.modelos.especialidad import Especialidad
    from app.modulos.m2_agenda.modelos.horario_medico import HorarioMedico


class Medico(Base):
    __tablename__ = "medico"

    id_medico: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    nombres: Mapped[str] = mapped_column(String(80))
    apellidos: Mapped[str] = mapped_column(String(80))
    colegiatura: Mapped[str] = mapped_column(String(12), unique=True)
    id_especialidad: Mapped[int] = mapped_column(ForeignKey("especialidad.id_especialidad"))
    id_usuario: Mapped[int | None] = mapped_column(ForeignKey("usuario.id_usuario"), unique=True)

    especialidad: Mapped["Especialidad"] = relationship(lazy="joined")
    horarios: Mapped[list["HorarioMedico"]] = relationship(back_populates="medico")
