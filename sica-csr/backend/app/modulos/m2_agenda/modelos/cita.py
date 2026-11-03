from datetime import date, time

from sqlalchemy import ForeignKey, Identity, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.nucleo.base_datos import Base

ESTADOS_CITA = ("registrada", "confirmada", "triada", "atendida", "cancelada", "inasistente")


class Cita(Base):
    __tablename__ = "cita"
    __table_args__ = (
        # Un cupo solo puede tener una cita vigente (RF08): la BD responde con IntegrityError → HTTP 409
        Index("ux_cita_cupo", "id_medico", "fecha", "hora", unique=True, postgresql_where=text("estado <> 'cancelada'")),
        Index("ix_cita_paciente", "id_paciente"),
    )

    id_cita: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    id_paciente: Mapped[int] = mapped_column(ForeignKey("paciente.id_paciente"))
    id_medico: Mapped[int] = mapped_column(ForeignKey("medico.id_medico"))
    fecha: Mapped[date]
    hora: Mapped[time]
    estado: Mapped[str] = mapped_column(String(15), default="registrada")
    motivo_cancelacion: Mapped[str | None] = mapped_column(String(200))
