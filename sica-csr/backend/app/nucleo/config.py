"""Configuración leída del archivo .env (o de variables de entorno)."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

RAIZ_PROYECTO = Path(__file__).resolve().parents[3]


class Configuracion(BaseSettings):
    model_config = SettingsConfigDict(env_file=RAIZ_PROYECTO / ".env", extra="ignore")

    database_url: str = "postgresql+psycopg://sica:sica@localhost:5432/sica"

    jwt_secret: str = "cambiar-esta-clave-por-una-larga-y-aleatoria"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 15
    jwt_refresh_expire_minutes: int = 480

    cors_origenes: str = "http://localhost:5173"

    # Hora local de la clínica: cupos «pasados», fechas de registro y recordatorios
    zona_horaria: str = "America/Lima"

    recordatorios_activos: bool = False
    recordatorios_intervalo_min: int = 10

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_numero_sms: str = ""
    twilio_numero_whatsapp: str = ""
    smtp_host: str = ""
    smtp_puerto: int = 587
    smtp_usuario: str = ""
    smtp_clave: str = ""
    smtp_remitente: str = ""

    @property
    def lista_cors(self) -> list[str]:
        return [o.strip() for o in self.cors_origenes.split(",") if o.strip()]


@lru_cache
def obtener_configuracion() -> Configuracion:
    return Configuracion()
