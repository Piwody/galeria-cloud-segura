import os
from pathlib import Path

CARPETA_BACKEND = Path(__file__).resolve().parent.parent
URL_BASE_DATOS = f"sqlite:///{CARPETA_BACKEND / 'galeria.db'}"

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
