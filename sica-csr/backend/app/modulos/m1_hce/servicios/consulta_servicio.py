"""Registrar consulta con diagnóstico CIE-10 y receta (HU05) y anularla con motivo (HU12). Nunca borrar: solo anular."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modulos.m1_hce.esquemas.consulta_medica import ConsultaAnular, ConsultaCrear, ConsultaSalida
from app.modulos.m1_hce.modelos import Cie10, ConsultaMedica, DiagnosticoConsulta, HistoriaClinica, Receta
from app.modulos.m2_agenda.servicios import cita_servicio
from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.excepciones import Conflicto, DatosInvalidos, NoEncontrado
from app.nucleo.tiempo import ahora, hoy


def registrar(db: Session, datos: ConsultaCrear, auditor: Auditor) -> ConsultaSalida:
    codigos = [d.codigo_cie10 for d in datos.diagnosticos]
    existentes = set(db.scalars(select(Cie10.codigo).where(Cie10.codigo.in_(codigos))))
    faltantes = [c for c in codigos if c not in existentes]
    if faltantes:
        raise DatosInvalidos(f"El código CIE-10 {', '.join(faltantes)} no existe en el catálogo.")

    # La cita pertenece a M2: se cambia a través de su servicio
    cita = cita_servicio.cambiar_estado(db, datos.id_cita, desde=("confirmada", "triada"), hacia="atendida")
    id_historia = db.scalar(select(HistoriaClinica.id_historia).where(HistoriaClinica.id_paciente == cita.id_paciente))

    consulta = ConsultaMedica(
        id_cita=cita.id_cita, id_historia=id_historia, fecha_consulta=ahora(),
        motivo=datos.motivo, evolucion=datos.evolucion, anulada=False,
    )
    db.add(consulta)
    db.flush()
    db.add_all(
        DiagnosticoConsulta(id_consulta=consulta.id_consulta, codigo_cie10=d.codigo_cie10, es_principal=d.es_principal)
        for d in datos.diagnosticos
    )
    if datos.indicaciones:
        db.add(Receta(id_consulta=consulta.id_consulta, indicaciones=datos.indicaciones, fecha_emision=hoy()))
    db.flush()
    auditor.registrar("CREAR", "consulta_medica", consulta.id_consulta, f"cita {cita.id_cita} · {', '.join(codigos)}")
    db.commit()
    return ConsultaSalida.model_validate(consulta)


def anular(db: Session, id_consulta: int, datos: ConsultaAnular, auditor: Auditor) -> ConsultaSalida:
    consulta = db.get(ConsultaMedica, id_consulta)
    if consulta is None:
        raise NoEncontrado("Consulta no encontrada")
    if consulta.anulada:
        raise Conflicto("La entrada ya estaba anulada.")
    consulta.anulada = True
    consulta.motivo_anulacion = datos.motivo
    consulta.anulada_por = auditor.id_usuario
    consulta.fecha_anulacion = ahora()
    auditor.registrar("ANULAR", "consulta_medica", consulta.id_consulta, datos.motivo)
    db.commit()
    return ConsultaSalida.model_validate(consulta)
