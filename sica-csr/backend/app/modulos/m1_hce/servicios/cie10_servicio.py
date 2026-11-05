"""Búsqueda en el catálogo CIE-10 (HU05)."""
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.modulos.m1_hce.esquemas.cie10 import Cie10Salida
from app.modulos.m1_hce.modelos import Cie10

LIMITE = 8


def buscar(db: Session, texto: str) -> list[Cie10Salida]:
    """Código que empieza por el texto o descripción que lo contiene."""
    texto = texto.strip()
    consulta = (
        select(Cie10)
        .where(or_(Cie10.codigo.ilike(f"{texto}%"), Cie10.descripcion.ilike(f"%{texto}%")))
        .order_by(Cie10.codigo)
        .limit(LIMITE)
    )
    return [Cie10Salida.model_validate(c) for c in db.scalars(consulta)]
