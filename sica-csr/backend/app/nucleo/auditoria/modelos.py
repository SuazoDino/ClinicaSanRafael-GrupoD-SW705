from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, func, Identity, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.nucleo.base_datos import Base


class Bitacora(Base):
    """Inmutable: la BD rechaza UPDATE y DELETE (trigger trg_bitacora_inmutable)."""

    __tablename__ = "bitacora"

    id_bitacora: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
    accion: Mapped[str] = mapped_column(String(30))
    entidad: Mapped[str] = mapped_column(String(40))
    id_entidad: Mapped[int | None] = mapped_column(BigInteger)
    fecha_hora: Mapped[datetime] = mapped_column(server_default=func.now())
    ip_origen: Mapped[str | None] = mapped_column(String(45))
    detalle: Mapped[str | None] = mapped_column(Text)
