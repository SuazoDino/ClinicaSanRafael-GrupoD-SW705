from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.nucleo.base_datos import Base

if TYPE_CHECKING:
    from app.modulos.m1_hce.modelos.cie10 import Cie10
    from app.modulos.m1_hce.modelos.consulta_medica import ConsultaMedica


class DiagnosticoConsulta(Base):
    __tablename__ = "diagnostico_consulta"
    __table_args__ = (
        Index("ux_diagnostico_principal", "id_consulta", unique=True, postgresql_where=text("es_principal")),
    )

    id_consulta: Mapped[int] = mapped_column(ForeignKey("consulta_medica.id_consulta"), primary_key=True)
    codigo_cie10: Mapped[str] = mapped_column(String(8), ForeignKey("cie10.codigo"), primary_key=True)
    es_principal: Mapped[bool] = mapped_column(default=False)

    consulta: Mapped["ConsultaMedica"] = relationship(back_populates="diagnosticos")
    cie10: Mapped["Cie10"] = relationship(lazy="joined")
