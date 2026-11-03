from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Identity, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base

if TYPE_CHECKING:
    from app.modulos.m1_hce.modelos.consulta_medica import ConsultaMedica
    from app.modulos.m1_hce.modelos.paciente import Paciente


class HistoriaClinica(Base):
    __tablename__ = "historia_clinica"

    id_historia: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    # La BD genera el número (HCE-000001) con la secuencia seq_numero_hce
    numero_hce: Mapped[str] = mapped_column(
        String(12), unique=True, server_default=text("('HCE-' || LPAD(nextval('seq_numero_hce')::TEXT, 6, '0'))")
    )
    id_paciente: Mapped[int] = mapped_column(ForeignKey("paciente.id_paciente"), unique=True)
    fecha_apertura: Mapped[date] = mapped_column(server_default=text("CURRENT_DATE"))
    antecedentes: Mapped[str | None] = mapped_column(Text)
    alergias: Mapped[str | None] = mapped_column(Text)

    paciente: Mapped["Paciente"] = relationship(back_populates="historia")
    consultas: Mapped[list["ConsultaMedica"]] = relationship(
        back_populates="historia", order_by="ConsultaMedica.fecha_consulta.desc()"
    )
