from datetime import time
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Identity, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base

if TYPE_CHECKING:
    from app.modulos.m2_agenda.modelos.medico import Medico


class HorarioMedico(Base):
    """Rango de atención semanal de un médico; los cupos se calculan a partir de aquí."""

    __tablename__ = "horario_medico"

    id_horario: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    id_medico: Mapped[int] = mapped_column(ForeignKey("medico.id_medico"))
    dia_semana: Mapped[int] = mapped_column(SmallInteger)  # 1 = lunes … 7 = domingo
    hora_inicio: Mapped[time]
    hora_fin: Mapped[time]
    duracion_cupo_min: Mapped[int] = mapped_column(SmallInteger, default=20)

    medico: Mapped["Medico"] = relationship(back_populates="horarios")
