from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Identity, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base

if TYPE_CHECKING:
    from app.modulos.m1_hce.modelos.consulta_medica import ConsultaMedica


class Receta(Base):
    __tablename__ = "receta"

    id_receta: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    id_consulta: Mapped[int] = mapped_column(ForeignKey("consulta_medica.id_consulta"), unique=True)
    indicaciones: Mapped[str] = mapped_column(Text)
    fecha_emision: Mapped[date] = mapped_column(server_default=text("CURRENT_DATE"))

    consulta: Mapped["ConsultaMedica"] = relationship(back_populates="receta")
