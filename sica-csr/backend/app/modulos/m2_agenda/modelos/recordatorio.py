from datetime import datetime

from sqlalchemy import ForeignKey, Identity, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.nucleo.base_datos import Base


class Recordatorio(Base):
    __tablename__ = "recordatorio"
    __table_args__ = (
        Index("ix_recordatorio_pendiente", "fecha_programada", postgresql_where=text("estado = 'pendiente'")),
    )

    id_recordatorio: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    id_cita: Mapped[int] = mapped_column(ForeignKey("cita.id_cita"))
    canal: Mapped[str] = mapped_column(String(10))  # sms, whatsapp, email
    fecha_programada: Mapped[datetime]
    estado: Mapped[str] = mapped_column(String(10), default="pendiente")  # pendiente, enviado, fallido
    respuesta: Mapped[str | None] = mapped_column(String(10))  # confirma, cancela
