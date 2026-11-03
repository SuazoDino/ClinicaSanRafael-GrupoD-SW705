# SICA-CSR

Sistema de Información Clínico-Administrativo de la Clínica San Rafael S.A.C.

Aplicación web que unifica la historia clínica electrónica y la agenda de citas de una clínica privada de San Borja, Lima, hoy gestionadas en papel, Excel y teléfono.

> **Estado:** en desarrollo.
> Proyecto integrador del Taller de Ingeniería de Software I (SW705), Universidad Nacional de Ingeniería, Facultad de Ingeniería Industrial y de Sistemas, Escuela de Ingeniería de Software.

## Contexto

La Clínica San Rafael ofrece consulta ambulatoria multiespecialidad, laboratorio, imágenes, farmacia y emergencia. Su operación presenta estos problemas:

- Historias clínicas en papel y Excel por especialidad, sin una vista unificada del paciente.
- Agenda telefónica saturada, con 18 % de inasistencia a citas.
- Resultados de laboratorio en papel, con demoras de hasta 48 h.
- Reconciliación manual con 5 EPS y aseguradoras, que genera glosas.

SICA-CSR centraliza la historia clínica, evita citas duplicadas y recuerda la cita al paciente antes de la fecha.

## Alcance

| Módulo | Descripción |
|--------|-------------|
| M1 Historia clínica electrónica | Pacientes, HCE única, triaje, consultas, diagnósticos CIE-10 y recetas |
| M2 Agenda y citas médicas | Disponibilidad consolidada, reserva, reprogramación, cancelación y recordatorios |
| M3 Laboratorio e imágenes | Órdenes médicas y resultados digitales |
| M4 Facturación y convenios | Tarifario por convenio, copagos y glosas |
| M5 Reportes gerenciales | Ocupación, tiempos de espera, ingresos e inasistencia |
| M6 Portal del paciente | Agendamiento en línea y consulta virtual básica (deseable) |

Fuera de alcance: pasarela de pagos en línea, integración directa con plataformas de EPS o equipos médicos, hospitalización y cirugía ambulatoria.

## Arquitectura

Arquitectura en capas con una API REST monolítica modular. El código está en [`sica-csr/`](sica-csr/).

- **Presentación:** SPA en React (`sica-csr/frontend/`).
- **Negocio:** API en FastAPI (`sica-csr/backend/`), organizada en módulos independientes (`m1_hce`, `m2_agenda`) y un núcleo compartido con autenticación, auditoría y notificaciones.
- **Datos:** PostgreSQL con migraciones Alembic (`sica-csr/db/`).

Reglas del diseño:

1. Los módulos pueden usar el núcleo; el núcleo no depende de los módulos.
2. Cada módulo es dueño de sus tablas y se comunica con los demás solo por servicios o endpoints.
3. No hay borrado físico en tablas clínicas: las entradas se anulan con motivo, usuario y fecha, y un trigger de la base bloquea el `DELETE`.
4. Acceso por rol (JWT) y bitácora de auditoría inmutable.

Para agregar modelos, endpoints o pantallas, ver la **[Guía de desarrollo](sica-csr/GUIA_DESARROLLO.md)**.

## Stack

| Capa / Componente | Tecnologías / Herramientas |
| :--- | :--- |
| **Lenguaje Core** | Python 3.12 |
| **Backend Framework** | FastAPI |
| **ORM & Migraciones** | SQLAlchemy, Alembic |
| **Base de Datos** | PostgreSQL 16 |
| **Frontend Framework / Build** | React, Vite |
| **Pruebas (Testing & Load)** | pytest, Locust |
| **Contenedorización** | Docker |
| **Integración continua** | GitHub Actions |

## Estructura

```
sica-csr/
├── backend/app/
│   ├── nucleo/          autenticación, auditoría, notificaciones, configuración
│   ├── modulos/
│   │   ├── m1_hce/      modelos, esquemas, servicios, rutas
│   │   └── m2_agenda/   modelos, esquemas, servicios, rutas
│   └── main.py
├── frontend/src/
│   ├── compartido/      cliente HTTP, sesión, layout
│   └── modulos/         pantallas de M1 y M2
├── db/                  migraciones, esquema SQL y datos de prueba
└── pruebas/             unitarias, integración y rendimiento
TallerSW/                documentación de ingeniería
```

## Ejecución local

Requisito: Docker. Desde la carpeta `sica-csr/`:

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API y documentación interactiva: http://localhost:8000/docs
- Usuarios de prueba (contraseña `Sica2026!`): `admin`, `recepcion`, `enfermera`, `medico`, `cardiologo`

Al iniciar se aplican las migraciones y se cargan los datos ficticios. Si un puerto ya está ocupado, cámbialo en el `.env` (`PUERTO_WEB`, `PUERTO_API`, `PUERTO_DB`).

<details>
<summary>Sin Docker (Python 3.12, Node.js 20+ y PostgreSQL 16 instalados)</summary>

```bash
cd sica-csr && cp .env.example .env    # ajustar DATABASE_URL
cd db && alembic upgrade head && python cargar_datos_prueba.py && cd ..
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
uvicorn app.main:app --reload          # en otra terminal:
cd frontend && npm install && npm run dev
```
</details>

## Pruebas

Desde `sica-csr/`, con la base de datos levantada (`docker compose up -d db`):

```bash
pytest
python pruebas/rendimiento/generar_datos_carga.py
locust -f pruebas/rendimiento/locustfile.py --host http://localhost:8000
```

## Documentación

La documentación de ingeniería está en [`TallerSW/`](TallerSW/): acta de constitución, visión, requerimientos, backlog, modelos UML, arquitectura, modelo de datos, prototipo UX/UI y plan de release.

## Datos y privacidad

El sistema maneja información de salud sujeta a la Ley N.° 29733. Todo dato del repositorio, de las pruebas y de las demostraciones es ficticio o anonimizado. Nunca se usan datos reales de pacientes.

## Equipo D

| Integrante | Rol |
|------------|-----|
| Zamudio Sanchez, Farid Paolo | Scrum Master |
| Suazo Zanabria, Dino Paul Roel | Product Owner |
| Fernandez Dueñas, Yazid Elio | Desarrollador |