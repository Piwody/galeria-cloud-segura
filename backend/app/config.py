import os
from pathlib import Path

CARPETA_BACKEND = Path(__file__).resolve().parent.parent
URL_BASE_DATOS = f"sqlite:///{CARPETA_BACKEND / 'galeria.db'}"

# Orígenes que pueden llamar a la API: el sitio de S3 y Live Server en el computador
ORIGENES_PERMITIDOS = r"https?://(([a-z0-9.-]+\.)?s3-website[.-][a-z0-9-]+\.amazonaws\.com|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)"

S3_BUCKET = os.getenv("MURALIA_S3_BUCKET", "muraliacloudimagenes")
S3_REGION = os.getenv("MURALIA_S3_REGION", "us-east-2")
S3_CARPETA = "imagenes/"
URL_BASE_S3 = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/"
MINUTOS_PARA_SUBIR = 5

TIPOS_PERMITIDOS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
}
TAMANO_MAXIMO = 10 * 1024 * 1024
