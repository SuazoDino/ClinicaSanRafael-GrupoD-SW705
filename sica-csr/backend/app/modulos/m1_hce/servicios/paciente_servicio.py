"""Reglas de negocio de pacientes (HU03 · RF01)."""
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.modulos.m1_hce.esquemas.paciente import PacienteActualizar, PacienteCrear, PacienteSalida
from app.modulos.m1_hce.modelos import HistoriaClinica, Paciente
from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.excepciones import Conflicto, NoEncontrado


def _a_salida(paciente: Paciente) -> PacienteSalida:
    return PacienteSalida(
        id_paciente=paciente.id_paciente,
        dni=paciente.dni,
        nombres=paciente.nombres,
        apellidos=paciente.apellidos,
        telefono=paciente.telefono,
        email=paciente.email,
        fecha_nacimiento=paciente.fecha_nacimiento,
        id_historia=paciente.historia.id_historia,
        numero_hce=paciente.historia.numero_hce,
    )


def buscar(db: Session, texto: str, limite: int = 20) -> list[PacienteSalida]:
    """Busca por DNI (desde el inicio) o por nombre/apellido parcial."""
    filtro = Paciente.dni.startswith(texto) if texto.isdigit() else or_(
        Paciente.nombres.ilike(f"%{texto}%"), Paciente.apellidos.ilike(f"%{texto}%")
    )
    pacientes = db.scalars(select(Paciente).where(filtro).order_by(Paciente.apellidos).limit(limite))
    return [_a_salida(p) for p in pacientes]


def obtener(db: Session, id_paciente: int, auditor: Auditor) -> PacienteSalida:
    paciente = db.get(Paciente, id_paciente)
    if paciente is None:
        raise NoEncontrado("Paciente no encontrado")
    auditor.registrar("CONSULTAR", "paciente", id_paciente)
    db.commit()
    return _a_salida(paciente)


def registrar(db: Session, datos: PacienteCrear, auditor: Auditor) -> PacienteSalida:
    existente = db.scalar(select(Paciente).where(Paciente.dni == datos.dni))
    if existente is not None:
        # HU03 · criterio 2: el frontend usa id_paciente para abrir el paciente existente
        raise Conflicto("Ya existe un paciente con ese DNI", id_paciente=existente.id_paciente)

    paciente = Paciente(**datos.model_dump(exclude={"antecedentes", "alergias"}))
    paciente.historia = HistoriaClinica(antecedentes=datos.antecedentes, alergias=datos.alergias)
    db.add(paciente)
    db.flush()  # obtiene id_paciente y numero_hce generados por la BD
    db.refresh(paciente.historia)
    auditor.registrar("CREAR", "paciente", paciente.id_paciente, f"HCE {paciente.historia.numero_hce}")
    db.commit()
    return _a_salida(paciente)


def actualizar(db: Session, id_paciente: int, datos: PacienteActualizar, auditor: Auditor) -> PacienteSalida:
    paciente = db.get(Paciente, id_paciente)
    if paciente is None:
        raise NoEncontrado("Paciente no encontrado")
    for campo, valor in datos.model_dump().items():
        setattr(paciente, campo, valor)
    auditor.registrar("ACTUALIZAR", "paciente", id_paciente)
    db.commit()
    return _a_salida(paciente)
