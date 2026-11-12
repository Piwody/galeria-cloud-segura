from pathlib import Path

CARPETA_BACKEND = Path(__file__).resolve().parent.parent
CARPETA_IMAGENES = CARPETA_BACKEND / "uploads"
URL_BASE_DATOS = f"sqlite:///{CARPETA_BACKEND / 'galeria.db'}"

# Orígenes que pueden llamar a la API: el sitio de S3 y Live Server en el computador
ORIGENES_PERMITIDOS = r"https?://(([a-z0-9.-]+\.)?s3-website[.-][a-z0-9-]+\.amazonaws\.com|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)"

EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}
TAMANO_MAXIMO = 10 * 1024 * 1024
