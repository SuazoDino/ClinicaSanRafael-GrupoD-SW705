"""Registro en la bitácora de auditoría (RFN01, Ley N.° 29733)."""
from sqlalchemy.orm import Session

from app.nucleo.auditoria.modelos import Bitacora


class Auditor:
    """Se obtiene en las rutas con `auditor: AuditorActual` y ya conoce al usuario y su IP.

    El registro se guarda en la misma transacción que la operación: si la operación
    falla, tampoco queda en la bitácora.
    """

    def __init__(self, db: Session, id_usuario: int, ip: str | None = None):
        self.db = db
        self.id_usuario = id_usuario
        self.ip = ip

    def registrar(self, accion: str, entidad: str, id_entidad: int | None = None, detalle: str | None = None) -> None:
        self.db.add(
            Bitacora(
                id_usuario=self.id_usuario,
                accion=accion,
                entidad=entidad,
                id_entidad=id_entidad,
                ip_origen=self.ip,
                detalle=detalle,
            )
        )
