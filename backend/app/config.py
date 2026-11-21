import os
from pathlib import Path

CARPETA_BACKEND = Path(__file__).resolve().parent.parent
URL_BASE_DATOS = f"sqlite:///{CARPETA_BACKEND / 'galeria.db'}"

# Base de datos: por defecto el archivo local galeria.db (SQLite).
# Opción preparada para más adelante: MURALIA_DB=rds usa una base compartida en Amazon RDS PostgreSQL,
# con autenticación IAM (sin contraseña). Requiere crearla con despliegue/crear-rds.sh e instalar psycopg.
DB_MODO = os.getenv("MURALIA_DB", "sqlite")
RDS_INSTANCIA = os.getenv("MURALIA_RDS_INSTANCIA", "muralia-db")
RDS_HOST = os.getenv("MURALIA_RDS_HOST", "")  # vacío: se busca solo por el nombre de la instancia
RDS_PUERTO = int(os.getenv("MURALIA_RDS_PUERTO", "5432"))
RDS_USUARIO = os.getenv("MURALIA_RDS_USUARIO", "muralia_app")
RDS_BASE = os.getenv("MURALIA_RDS_BASE", "muralia")
RDS_REGION = os.getenv("MURALIA_RDS_REGION", "us-east-1")

# Orígenes que pueden llamar a la API: el sitio de S3 y Live Server en el computador
ORIGENES_PERMITIDOS = r"https?://(([a-z0-9.-]+\.)?s3-website[.-][a-z0-9-]+\.amazonaws\.com|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)"

S3_BUCKET = os.getenv("MURALIA_S3_BUCKET", "muralia-media-913051689392")
S3_REGION = os.getenv("MURALIA_S3_REGION", "us-east-1")
# Flujo de moderación: el navegador sube a uploads/, la Lambda muralia-moderacion
# revisa la foto con Amazon Rekognition y la mueve a approved/ o rejected/.
S3_CARPETA = "approved/"
S3_CARPETA_SUBIDAS = "uploads/"
S3_CARPETA_RECHAZADAS = "rejected/"
SEGUNDOS_MODERACION = 20
URL_BASE_S3 = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/"
MINUTOS_PARA_SUBIR = 5

TIPOS_PERMITIDOS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
TAMANO_MAXIMO = 10 * 1024 * 1024
