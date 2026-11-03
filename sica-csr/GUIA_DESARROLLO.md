# Guía de desarrollo

Cómo está organizado el código y qué pasos seguir para agregar algo nuevo. El ejemplo completo
de referencia es **Registro de pacientes (HU03)**: copia su patrón.

## 1. ¿Es MVC?

No exactamente. El SAD define una **arquitectura en capas** (presentación → negocio → datos).
La equivalencia con Laravel es:

| Laravel | SICA-CSR | Capa | Responsabilidad |
| :--- | :--- | :--- | :--- |
| Model (Eloquent) | `modelos/` | Datos | Una clase por tabla. Sin lógica de negocio. |
| FormRequest | `esquemas/` | Negocio | Valida lo que entra y define lo que sale (Pydantic). |
| Service | `servicios/` | Negocio | Reglas del negocio, bitácora y `commit`. |
| Controller + routes/api.php | `rutas/` | Negocio (API) | Endpoint, rol requerido y llamada al servicio. Sin lógica. |
| Middleware `auth`, `role` | `requiere_roles(...)` | Transversal | JWT + RBAC. |
| Blade / vistas | `frontend/src/modulos/*/` | Presentación | Pantallas en React. |
| Migrations | `db/migraciones/` | Datos | Alembic. |

Flujo de una petición:

```
Pantalla .jsx → api.js → clienteHttp (token) → /api/... → rutas → esquemas (valida) → servicios → modelos → PostgreSQL
```

Reglas:
1. Las **rutas** no tienen lógica: reciben, llaman al servicio y devuelven.
2. Los **servicios** lanzan errores de negocio (`NoEncontrado`, `Conflicto`, ...); la API los convierte en 404, 409, etc.
3. Cada operación sobre datos clínicos se registra con `auditor.registrar(...)` antes del `db.commit()`.
4. Nunca se borra un registro clínico: se anula (la BD bloquea el `DELETE`).
5. El `nucleo/` no importa nada de `modulos/`.

## 2. Estructura

```
sica-csr/
├── backend/app/
│   ├── main.py                 crea la app (CORS, errores, rutas, recordatorios)
│   ├── api/rutas.py            registra los routers de todos los módulos bajo /api
│   ├── registro_modelos.py     importa todos los modelos (para Alembic)
│   ├── nucleo/                 config, BD, seguridad, dependencias, errores, auth, bitácora, notificaciones
│   └── modulos/
│       ├── m1_hce/             modelos/ esquemas/ servicios/ rutas/
│       └── m2_agenda/          modelos/ esquemas/ servicios/ rutas/
├── frontend/src/
│   ├── rutas.js                registro central de pantallas (genera rutas y menú)
│   ├── compartido/             clienteHttp, sesión, login, layout, componentes comunes
│   └── modulos/
│       ├── m1_hce/             rutas.js, api.js y una carpeta por pantalla
│       └── m2_agenda/          rutas.js, api.js y una carpeta por pantalla
├── db/
│   ├── sql/                    esquema inicial (DDL del documento de BD)
│   ├── migraciones/versions/   migraciones de Alembic
│   ├── datos_prueba/           CSV ficticios
│   └── cargar_datos_prueba.py  carga los CSV
└── pruebas/                    unitarias/, integracion/, rendimiento/
```

## 3. Agregar un endpoint (backend)

Ejemplo: HU11 · registrar triaje. Los archivos ya existen; solo hay que llenarlos.

**a) Esquema** (`modulos/m1_hce/esquemas/triaje.py`):

```python
from pydantic import BaseModel, ConfigDict, Field

class TriajeCrear(BaseModel):
    id_cita: int
    presion_sistolica: int = Field(ge=50, le=300)
    # ...

class TriajeSalida(TriajeCrear):
    model_config = ConfigDict(from_attributes=True)
    id_triaje: int
```

**b) Servicio** (`modulos/m1_hce/servicios/triaje_servicio.py`):

```python
from sqlalchemy.orm import Session
from app.modulos.m1_hce.modelos import Triaje
from app.modulos.m2_agenda.servicios import cita_servicio
from app.nucleo.auditoria.servicio import Auditor

def registrar(db: Session, datos, auditor: Auditor) -> Triaje:
    # La cita pertenece a M2: se cambia a través de su servicio, no tocando su modelo
    cita_servicio.cambiar_estado(db, datos.id_cita, desde="confirmada", hacia="triada")
    triaje = Triaje(**datos.model_dump(), registrado_por=auditor.id_usuario)
    db.add(triaje)
    db.flush()
    auditor.registrar("CREAR", "triaje", triaje.id_triaje)
    db.commit()
    return triaje
```

**c) Ruta** (`modulos/m1_hce/rutas/triaje.py`; el `router` ya está creado y registrado):

```python
@router.post("", response_model=TriajeSalida, status_code=201, dependencies=[requiere_roles("enfermera")])
def registrar(datos: TriajeCrear, db: Sesion, auditor: AuditorActual):
    return triaje_servicio.registrar(db, datos, auditor)
```

Listo: aparece en http://localhost:8000/docs.

> `cita_servicio.cambiar_estado` es una función que M2 debe exponer (aún no existe). Regla: un módulo
> lee y modifica las tablas de otro módulo solo a través de los servicios de ese módulo.

**Archivo de rutas nuevo:** créalo con `router = APIRouter(prefix="/...", tags=[...])` y agrégalo
a la tupla de `modulos/<modulo>/rutas/__init__.py`.

## 4. Agregar una tabla o columna (modelo + migración)

1. Crea o edita el modelo en `modulos/<modulo>/modelos/` (copia el formato de `paciente.py`).
2. Si es un archivo nuevo, impórtalo en `modulos/<modulo>/modelos/__init__.py`.
3. Genera la migración y aplícala:

```bash
cd db
alembic revision --autogenerate -m "agrega tabla x"
alembic upgrade head
```

4. Revisa el archivo generado en `db/migraciones/versions/`. Los triggers, las secuencias y los CHECK
   no se detectan solos: agrégalos con `op.execute("...")`. Si la tabla es clínica, agrega su trigger
   `trg_no_delete_<tabla>` (ver `db/sql/sica_esquema_datos.sql`).
5. Actualiza el modelo ER y el DDL en `TallerSW/03_arquitectura_y_base_de_datos/`.

## 5. Agregar una pantalla (frontend)

**a) Función en `api.js` del módulo:**

```js
export const triajeApi = {
  registrar: (datos) => http.post('/triajes', datos).then((r) => r.data),
}
```

**b) Pantalla** en `modulos/<modulo>/<Pantalla>/<Pantalla>.jsx` (copia `RegistroPaciente.jsx`):
estado con `useState`, llamada a `triajeApi`, errores con `mensajeError(err)`.

**c) Registro** en `modulos/<modulo>/rutas.js`:

```js
{ ruta: '/triaje', titulo: 'Triaje', componente: Triaje, roles: ['enfermera'] },
```

La ruta, la protección por rol y el enlace del menú se generan solos. Usa `enMenu: false` para pantallas
que se abren desde otra (p. ej. `/hce/:idPaciente`; el parámetro se lee con `useParams()`).

Clases CSS disponibles (`src/index.css`): `tarjeta`, `formulario`, `fila`, `boton`, `boton--secundario`,
`alerta`, `alerta--error`, `alerta--exito`, `datos`, `ancho-completo`, `texto-suave`.

## 6. Módulo nuevo (Sprint 2, p. ej. M3)

1. Backend: copia la estructura de carpetas de `m1_hce` a `modulos/m3_laboratorio/`.
2. Registra su router en `api/rutas.py` y sus modelos en `registro_modelos.py`.
3. Frontend: crea `modulos/m3_laboratorio/rutas.js` y agrégalo en `src/rutas.js`.

## 7. Pruebas

```bash
docker compose up -d db      # solo la base de datos
pytest                       # usa la BD sica_pruebas, que se recrea sola
```

Cada prueba corre dentro de una transacción que se revierte al terminar. Fixtures útiles (ver `pruebas/conftest.py`):
`cliente` (llama a la API), `crear_usuario("medico")` (devuelve usuario y cabeceras con token) y `db`.
Las pruebas de historias pendientes están marcadas con `@pytest.mark.skip`: quita la marca al implementarlas.

## 8. Roles y usuarios de prueba

Los roles son `administrador`, `recepcionista`, `enfermera` y `medico`; el administrador entra a todo.
Usuarios cargados por `db/cargar_datos_prueba.py` (contraseña `Sica2026!`):
`admin`, `recepcion`, `enfermera`, `medico`, `cardiologo`.
