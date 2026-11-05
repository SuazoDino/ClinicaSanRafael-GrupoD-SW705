"""Arma la HCE unificada con pocas consultas a la BD (<2 s con 8 000 pacientes) y la registra en bitácora (HU04)."""
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modulos.m1_hce.esquemas.consulta_medica import ConsultaSalida
from app.modulos.m1_hce.esquemas.historia_clinica import ConsultaHCE, DiagnosticoSalida, HistoriaSalida
from app.modulos.m1_hce.esquemas.receta import RecetaSalida
from app.modulos.m1_hce.esquemas.triaje import TriajeSalida
from app.modulos.m1_hce.modelos import ConsultaMedica, DiagnosticoConsulta, Paciente, Triaje
from app.modulos.m1_hce.servicios.paciente_servicio import a_salida as paciente_a_salida
from app.modulos.m2_agenda.servicios import cita_servicio, disponibilidad_servicio
from app.nucleo.auditoria.servicio import Auditor
from app.nucleo.autenticacion.modelos import Usuario
from app.nucleo.excepciones import NoEncontrado
from app.nucleo.tiempo import hoy

POR_ATENDER = ("confirmada", "triada")


def _diagnosticos(consulta: ConsultaMedica) -> list[DiagnosticoSalida]:
    ordenados = sorted(consulta.diagnosticos, key=lambda d: (not d.es_principal, d.codigo_cie10))
    return [
        DiagnosticoSalida(
            id_consulta=d.id_consulta, codigo_cie10=d.codigo_cie10, es_principal=d.es_principal,
            descripcion=d.cie10.descripcion,
        )
        for d in ordenados
    ]


def obtener(db: Session, id_paciente: int, auditor: Auditor) -> HistoriaSalida:
    paciente = db.scalar(
        select(Paciente).where(Paciente.id_paciente == id_paciente).options(selectinload(Paciente.historia))
    )
    if paciente is None:
        raise NoEncontrado("Paciente no encontrado")
    historia = paciente.historia

    consultas = db.scalars(
        select(ConsultaMedica)
        .where(ConsultaMedica.id_historia == historia.id_historia)
        .options(
            selectinload(ConsultaMedica.diagnosticos).joinedload(DiagnosticoConsulta.cie10),
            selectinload(ConsultaMedica.receta),
        )
        .order_by(ConsultaMedica.fecha_consulta.desc(), ConsultaMedica.id_consulta.desc())
    ).all()

    # Las citas son de M2: se leen a través de su servicio
    citas = {c.id_cita: c for c in cita_servicio.citas_del_paciente(db, id_paciente)}
    medicos = disponibilidad_servicio.medicos_por_id(db, {c.id_medico for c in citas.values()})
    ids_anuladores = {c.anulada_por for c in consultas if c.anulada_por}
    usernames = dict(
        db.execute(select(Usuario.id_usuario, Usuario.username).where(Usuario.id_usuario.in_(ids_anuladores))).all()
    ) if ids_anuladores else {}

    triaje = db.scalar(
        select(Triaje)
        .where(Triaje.id_cita.in_(citas.keys()))
        .order_by(Triaje.fecha_registro.desc(), Triaje.id_triaje.desc())
        .limit(1)
    ) if citas else None

    hoy_local = hoy()
    por_atender = sorted(
        (c for c in citas.values() if c.fecha == hoy_local and c.estado in POR_ATENDER), key=lambda c: c.hora
    )

    auditor.registrar("CONSULTAR", "historia_clinica", historia.id_historia, f"paciente {id_paciente}")
    db.commit()

    return HistoriaSalida(
        paciente=paciente_a_salida(paciente),
        antecedentes=historia.antecedentes,
        alergias=historia.alergias,
        triaje_reciente=TriajeSalida.model_validate(triaje) if triaje else None,
        consultas=[
            ConsultaHCE(
                **ConsultaSalida.model_validate(c).model_dump(),
                medico=medicos[citas[c.id_cita].id_medico],
                anulada_por_usuario=usernames.get(c.anulada_por),
                diagnosticos=_diagnosticos(c),
                receta=RecetaSalida.model_validate(c.receta) if c.receta else None,
            )
            for c in consultas
        ],
        citas_por_atender=cita_servicio.con_medico(db, por_atender),
    )
