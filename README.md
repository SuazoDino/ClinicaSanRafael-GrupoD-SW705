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

Arquitectura en capas con una API REST monolítica modular.

- **Presentación:** SPA en React (`frontend/`).
- **Negocio:** API en FastAPI (`backend/`), organizada en módulos independientes (`m1_hce`, `m2_agenda`) y un núcleo compartido con autenticación, auditoría y notificaciones.
- **Datos:** PostgreSQL con migraciones Alembic (`db/`).

Reglas del diseño:

1. Los módulos pueden usar el núcleo; el núcleo no depende de los módulos.
2. Cada módulo es dueño de sus tablas y se comunica con los demás solo por servicios o endpoints.
3. No hay borrado físico en tablas clínicas: las entradas se anulan con motivo, usuario y fecha, y un trigger de la base bloquea el `DELETE`.
4. Acceso por rol (JWT) y bitácora de auditoría inmutable.

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

## Estructura

```
backend/app/
├── nucleo/          autenticación, auditoría, notificaciones, configuración
├── modulos/
│   ├── m1_hce/      modelos, esquemas, servicios, rutas
│   └── m2_agenda/   modelos, esquemas, servicios, rutas
└── main.py
frontend/src/
├── compartido/      cliente HTTP, sesión, layout
└── modulos/         pantallas de M1 y M2
db/                  migraciones, esquema SQL y datos de prueba
pruebas/             unitarias, integración y rendimiento
docs/                documentación de ingeniería
```

## Ejecución local

Requisitos: Python 3.12, Node.js 20 o superior y PostgreSQL 16.

```bash
cp .env.example .env
```

Base de datos:

```bash
cd db
alembic upgrade head
```

Backend (http://localhost:8000, documentación en `/docs`):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

## Pruebas

```bash
pytest
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