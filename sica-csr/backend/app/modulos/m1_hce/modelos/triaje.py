from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, func, Identity, Numeric, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column

from app.nucleo.base_datos import Base


class Triaje(Base):
    __tablename__ = "triaje"

    id_triaje: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    id_cita: Mapped[int] = mapped_column(ForeignKey("cita.id_cita"), unique=True)
    registrado_por: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
    fecha_registro: Mapped[datetime] = mapped_column(server_default=func.now())
    presion_sistolica: Mapped[int] = mapped_column(SmallInteger)
    presion_diastolica: Mapped[int] = mapped_column(SmallInteger)
    frecuencia_cardiaca: Mapped[int] = mapped_column(SmallInteger)
    temperatura: Mapped[Decimal] = mapped_column(Numeric(4, 1))
    peso_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    talla_cm: Mapped[Decimal] = mapped_column(Numeric(5, 1))
