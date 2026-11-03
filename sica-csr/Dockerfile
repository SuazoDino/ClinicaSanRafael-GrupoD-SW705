# Imagen del backend (API FastAPI + migraciones de db/). Se construye desde la raíz de sica-csr.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /srv/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /srv/backend/
COPY db/ /srv/db/

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Aplica migraciones pendientes y levanta la API
CMD ["sh", "-c", "cd /srv/db && alembic upgrade head && cd /srv/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
