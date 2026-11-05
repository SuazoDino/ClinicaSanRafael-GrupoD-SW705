"""Carga datos ficticios para desarrollo y demostración. Se puede ejecutar varias veces.

    cd db && python cargar_datos_prueba.py

Usuarios creados (contraseña de todos: Sica2026!):
    admin (administrador), recepcion (recepcionista), enfermera (enfermera),
    medico y cardiologo (médicos, ver especialidades_medicos.csv)

La primera vez (tabla cita vacía) también carga una agenda de ejemplo relativa a hoy: atenciones pasadas con
triaje, consulta y receta, la agenda de hoy en distintos estados y citas de los próximos días. No se vuelve a
cargar después porque las tablas clínicas no permiten DELETE (para empezar de cero: docker compose down -v).
"""
import csv
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
sys.path.insert(0, str(CARPETA.parent / "backend"))

from sqlalchemy import text  # noqa: E402

from app.nucleo.base_datos import motor  # noqa: E402
from app.nucleo.seguridad import hashear_clave  # noqa: E402
from app.nucleo.tiempo import hoy  # noqa: E402

CLAVE_DEMO = "Sica2026!"
USUARIOS_BASE = [("admin", "administrador"), ("recepcion", "recepcionista"), ("enfermera", "enfermera")]


def _leer(nombre: str) -> list[dict]:
    with open(CARPETA / "datos_prueba" / nombre, encoding="utf-8") as archivo:
        return list(csv.DictReader(archivo))


def _crear_usuario(cx, username: str, rol: str, clave_hash: str) -> int:
    cx.execute(
        text(
            "INSERT INTO usuario (username, password_hash, id_rol) "
            "SELECT :u, :h, id_rol FROM rol WHERE nombre = :r ON CONFLICT (username) DO NOTHING"
        ),
        {"u": username, "h": clave_hash, "r": rol},
    )
    return cx.scalar(text("SELECT id_usuario FROM usuario WHERE username = :u"), {"u": username})


def main() -> None:
    clave_hash = hashear_clave(CLAVE_DEMO)
    with motor.begin() as cx:
        for username, rol in USUARIOS_BASE:
            _crear_usuario(cx, username, rol, clave_hash)

        cx.execute(
            text("INSERT INTO cie10 (codigo, descripcion) VALUES (:codigo, :descripcion) ON CONFLICT DO NOTHING"),
            _leer("cie10_catalogo.csv"),
        )

        for fila in _leer("especialidades_medicos.csv"):
            cx.execute(
                text("INSERT INTO especialidad (nombre) VALUES (:e) ON CONFLICT (nombre) DO NOTHING"),
                {"e": fila["especialidad"]},
            )
            id_usuario = _crear_usuario(cx, fila["usuario"], "medico", clave_hash) if fila["usuario"] else None
            id_medico = cx.scalar(
                text(
                    "INSERT INTO medico (nombres, apellidos, colegiatura, id_especialidad, id_usuario) "
                    "SELECT :n, :a, :c, id_especialidad, :u FROM especialidad WHERE nombre = :e "
                    "ON CONFLICT (colegiatura) DO NOTHING RETURNING id_medico"
                ),
                {"n": fila["nombres"], "a": fila["apellidos"], "c": fila["colegiatura"], "u": id_usuario,
                 "e": fila["especialidad"]},
            )
            if id_medico:  # médico nuevo: horario de lunes a viernes, 08:00–13:00, cupos de 20 min
                cx.execute(
                    text(
                        "INSERT INTO horario_medico (id_medico, dia_semana, hora_inicio, hora_fin) "
                        "SELECT :m, d, '08:00', '13:00' FROM generate_series(1, 5) AS d"
                    ),
                    {"m": id_medico},
                )

        for fila in _leer("pacientes_ficticios.csv"):
            id_paciente = cx.scalar(
                text(
                    "INSERT INTO paciente (dni, nombres, apellidos, telefono, email, fecha_nacimiento) "
                    "VALUES (:dni, :nombres, :apellidos, NULLIF(:telefono, ''), NULLIF(:email, ''), :fecha_nacimiento) "
                    "ON CONFLICT (dni) DO NOTHING RETURNING id_paciente"
                ),
                fila,
            )
            if id_paciente:
                cx.execute(text("INSERT INTO historia_clinica (id_paciente) VALUES (:p)"), {"p": id_paciente})

        if not cx.scalar(text("SELECT EXISTS (SELECT 1 FROM cita)")):
            _cargar_agenda_demo(cx)
            print("Agenda de ejemplo cargada.")

    print(f"Datos de prueba cargados. Usuarios: admin, recepcion, enfermera, medico, cardiologo (clave {CLAVE_DEMO})")



# ===== Agenda de ejemplo (la misma que mostraba el prototipo del frontend) =====
ANTECEDENTES = {
    "70000001": ("Hipertensión arterial desde 2019.", None),
    "70000003": ("Asma en la infancia.", "Penicilina"),
    "70000005": ("Hipertensión arterial. Exfumador.", "Sulfas"),
    "70000009": ("Diabetes mellitus tipo 2 e hiperlipidemia.", "Ibuprofeno, Mariscos"),
}


def _dias_habiles_siguientes(desde: date, cantidad: int) -> list[date]:
    dias, d = [], desde
    while len(dias) < cantidad:
        d += timedelta(days=1)
        if d.isoweekday() <= 5:
            dias.append(d)
    return dias


def _cargar_agenda_demo(cx) -> None:
    hoy_ = hoy()
    pac = dict(cx.execute(text("SELECT CAST(substr(dni, 7) AS INT), id_paciente FROM paciente WHERE dni LIKE '700000%'")).all())
    med = dict(cx.execute(text("SELECT CAST(substr(colegiatura, 4) AS INT) - 10000, id_medico FROM medico "
                               "WHERE colegiatura LIKE 'CMP1000%'")).all())
    usr = dict(cx.execute(text("SELECT username, id_usuario FROM usuario")).all())

    for dni, (antecedentes, alergias) in ANTECEDENTES.items():
        cx.execute(
            text("UPDATE historia_clinica SET antecedentes = :a, alergias = :al "
                 "WHERE id_paciente = (SELECT id_paciente FROM paciente WHERE dni = :d) AND antecedentes IS NULL"),
            {"a": antecedentes, "al": alergias, "d": dni},
        )

    def cita(p, m, fecha, hora, estado="registrada", motivo=None):
        id_cita = cx.scalar(
            text("INSERT INTO cita (id_paciente, id_medico, fecha, hora, estado, motivo_cancelacion) "
                 "VALUES (:p, :m, :f, :h, :e, :mo) RETURNING id_cita"),
            {"p": pac[p], "m": med[m], "f": fecha, "h": hora, "e": estado, "mo": motivo},
        )
        momento = datetime.combine(fecha, datetime.strptime(hora, "%H:%M").time())
        cx.execute(
            text("INSERT INTO recordatorio (id_cita, canal, fecha_programada, estado, respuesta) VALUES (:c, :ca, :fp, :e, :r)"),
            {"c": id_cita, "ca": "whatsapp" if p % 2 else "sms", "fp": momento - timedelta(hours=24),
             "e": "enviado" if fecha <= hoy_ + timedelta(days=1) else "pendiente",
             "r": "cancela" if estado == "cancelada" else ("confirma" if fecha <= hoy_ and p % 3 else None)},
        )
        return {"id": id_cita, "momento": momento, "p": p}

    def triaje(c, pa, pd, fc, t, peso, talla):
        cx.execute(
            text("INSERT INTO triaje (id_cita, registrado_por, fecha_registro, presion_sistolica, presion_diastolica, "
                 "frecuencia_cardiaca, temperatura, peso_kg, talla_cm) VALUES (:c, :u, :f, :pa, :pd, :fc, :t, :pe, :ta)"),
            {"c": c["id"], "u": usr["enfermera"], "f": c["momento"], "pa": pa, "pd": pd, "fc": fc, "t": t, "pe": peso, "ta": talla},
        )

    def consulta(c, motivo, evolucion, codigos, indicaciones=None, anulacion=None):
        id_consulta = cx.scalar(
            text("INSERT INTO consulta_medica (id_cita, id_historia, fecha_consulta, motivo, evolucion, anulada, "
                 "motivo_anulacion, anulada_por, fecha_anulacion) "
                 "SELECT :c, id_historia, :f, :mo, :ev, :an, :ma, :ap, :fa FROM historia_clinica WHERE id_paciente = :p "
                 "RETURNING id_consulta"),
            {"c": c["id"], "f": c["momento"], "mo": motivo, "ev": evolucion, "p": pac[c["p"]], "an": bool(anulacion),
             "ma": anulacion, "ap": usr["medico"] if anulacion else None,
             "fa": c["momento"].replace(hour=12, minute=30) if anulacion else None},
        )
        for i, codigo in enumerate(codigos):
            cx.execute(text("INSERT INTO diagnostico_consulta (id_consulta, codigo_cie10, es_principal) VALUES (:c, :co, :pr)"),
                       {"c": id_consulta, "co": codigo, "pr": i == 0})
        if indicaciones:
            cx.execute(text("INSERT INTO receta (id_consulta, indicaciones, fecha_emision) VALUES (:c, :i, :f)"),
                       {"c": id_consulta, "i": indicaciones, "f": c["momento"].date()})

    # Historial de atenciones anteriores
    def pasada(p, m, dias, hora):
        return cita(p, m, hoy_ - timedelta(days=dias), hora, "atendida")

    c = pasada(1, 1, 120, "09:00")
    triaje(c, 132, 85, 78, 36.5, 82, 172)
    consulta(c, "Dolor lumbar de 5 días tras cargar peso.", "Contractura paravertebral, sin signos de alarma.", ["M54.5"],
             "Naproxeno 550 mg: 1 tableta cada 12 h por 5 días, después de comer.\nCalor local 20 min 3 veces al día.")
    c = pasada(1, 1, 40, "10:20")
    triaje(c, 138, 88, 80, 36.7, 81, 172)
    consulta(c, "Control de presión arterial.", "Presión en rango alto. Se ajusta dosis y se refuerza dieta baja en sal.",
             ["I10"], "Losartán 50 mg: 1 tableta cada 24 h por la mañana.\nControl en 1 mes.")
    c = pasada(3, 2, 30, "08:40")
    consulta(c, "Dolor de garganta y congestión nasal.", "Faringe congestiva, sin placas.", ["J06.9"],
             "Paracetamol 500 mg: 1 tableta cada 8 h si hay fiebre o dolor, por 3 días.\nAbundantes líquidos.")
    c = pasada(9, 1, 60, "11:00")
    triaje(c, 128, 80, 74, 36.4, 88, 168)
    consulta(c, "Control de glicemia y colesterol.", "Glicemia en ayunas 142 mg/dL. LDL elevado.", ["E11.9", "E78.5"],
             "Metformina 850 mg: 1 tableta con almuerzo y cena.\nAtorvastatina 20 mg: 1 tableta en la noche.")
    c = pasada(5, 3, 15, "09:40")
    triaje(c, 150, 94, 88, 36.6, 76, 165)
    consulta(c, "Dolor torácico al esfuerzo.", "Registrado por error en otra cita.", ["R10.4"],
             anulacion="Se registró en la cita equivocada; se vuelve a registrar.")
    consulta(c, "Dolor torácico opresivo al subir escaleras.", "EKG sin cambios agudos. Se solicita prueba de esfuerzo.",
             ["I20.9", "I10"], "Ácido acetilsalicílico 100 mg: 1 tableta al día.\nEvitar esfuerzos intensos hasta el resultado.")

    # Agenda de hoy (solo si hoy hay horario: lunes a viernes)
    if hoy_.isoweekday() <= 5:
        c = cita(1, 1, hoy_, "08:00", "atendida")
        triaje(c, 130, 84, 76, 36.6, 80, 172)
        consulta(c, "Control de presión arterial.", "Presión controlada con losartán. Continúa tratamiento.", ["I10"],
                 "Losartán 50 mg: 1 tableta cada 24 h por la mañana.\nControl en 3 meses.")
        cita(3, 1, hoy_, "08:20", "inasistente")
        triaje(cita(5, 1, hoy_, "08:40", "triada"), 146, 92, 84, 36.8, 76, 165)
        cita(9, 1, hoy_, "09:00", "confirmada")
        cita(2, 1, hoy_, "09:40")
        cita(8, 1, hoy_, "10:20")
        cita(6, 1, hoy_, "11:00", "cancelada", "El paciente pidió cambiar a cardiología.")
        triaje(cita(4, 3, hoy_, "08:20", "triada"), 112, 70, 72, 36.4, 58, 160)
        cita(10, 3, hoy_, "09:00", "confirmada")
        cita(6, 3, hoy_, "11:20")
        cita(7, 5, hoy_, "09:20", "confirmada")
        cita(2, 6, hoy_, "10:40")

    # Próximos días hábiles (para que se vean cupos ocupados)
    d1, d2, d3 = _dias_habiles_siguientes(hoy_, 3)
    for p, m, fecha, hora in [(1, 1, d1, "08:00"), (4, 1, d1, "08:40"), (7, 1, d1, "10:00"), (9, 3, d1, "09:20"),
                              (3, 2, d2, "08:20"), (10, 1, d2, "11:40"), (8, 6, d3, "09:00")]:
        cita(p, m, fecha, hora)


if __name__ == "__main__":
    main()
