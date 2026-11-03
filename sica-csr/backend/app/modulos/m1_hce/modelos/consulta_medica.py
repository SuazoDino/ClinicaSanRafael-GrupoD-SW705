from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, func, Identity, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base

if TYPE_CHECKING:
    from app.modulos.m1_hce.modelos.diagnostico_consulta import DiagnosticoConsulta
    from app.modulos.m1_hce.modelos.historia_clinica import HistoriaClinica
    from app.modulos.m1_hce.modelos.receta import Receta


class ConsultaMedica(Base):
    """Nunca se borra: se anula con motivo, usuario y fecha (RF06, RFN04)."""

    __tablename__ = "consulta_medica"
    __table_args__ = (
        Index("ux_consulta_vigente", "id_cita", unique=True, postgresql_where=text("NOT anulada")),
        Index("ix_consulta_historia", "id_historia", text("fecha_consulta DESC")),
    )

    id_consulta: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    id_cita: Mapped[int] = mapped_column(ForeignKey("cita.id_cita"))
    id_historia: Mapped[int] = mapped_column(ForeignKey("historia_clinica.id_historia"))
    fecha_consulta: Mapped[datetime] = mapped_column(server_default=func.now())
    motivo: Mapped[str] = mapped_column(String(300))
    evolucion: Mapped[str | None] = mapped_column(Text)
    anulada: Mapped[bool] = mapped_column(default=False)
    motivo_anulacion: Mapped[str | None] = mapped_column(String(300))
    anulada_por: Mapped[int | None] = mapped_column(ForeignKey("usuario.id_usuario"))
    fecha_anulacion: Mapped[datetime | None]

    historia: Mapped["HistoriaClinica"] = relationship(back_populates="consultas")
    diagnosticos: Mapped[list["DiagnosticoConsulta"]] = relationship(back_populates="consulta")
    receta: Mapped["Receta | None"] = relationship(back_populates="consulta", uselist=False)
