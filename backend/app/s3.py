import re
import time
import unicodedata
import uuid
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.config import (MINUTOS_PARA_SUBIR, S3_BUCKET, S3_CARPETA, S3_CARPETA_RECHAZADAS,
                        S3_CARPETA_SUBIDAS, S3_REGION, SEGUNDOS_MODERACION,
                        TAMANO_MAXIMO, TIPOS_PERMITIDOS, URL_BASE_S3)

ErrorDeS3 = (BotoCoreError, ClientError)

cliente = boto3.client(
    "s3",
    region_name=S3_REGION,
    endpoint_url=f"https://s3.{S3_REGION}.amazonaws.com",
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)


def url_de(clave: str) -> str:
    return URL_BASE_S3 + clave


def carpeta_de(nombre_categoria: str) -> str:
    """Prefijo de S3 para una categoría: "Fotografía" -> "fotografia", "Paisajes urbanos" -> "paisajes-urbanos"."""
    sin_tildes = unicodedata.normalize("NFKD", nombre_categoria).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", sin_tildes.lower()).strip("-") or "sin-categoria"


def clave_de(url: str) -> str | None:
    """Devuelve la clave approved/<categoria>/<archivo> si la URL es de nuestro bucket; si no, None."""
    inicio = URL_BASE_S3 + S3_CARPETA
    if not url.startswith(inicio):
        return None
    resto = url[len(inicio):]
    if resto == "" or resto.count("/") > 1 or resto.startswith("/") or resto.endswith("/"):
        return None
    return url[len(URL_BASE_S3):]


def mover(origen: str, destino: str):
    """Mueve un archivo dentro del bucket (S3 no tiene "mover": se copia y se borra el original)."""
    cliente.copy_object(Bucket=S3_BUCKET, Key=destino, CopySource={"Bucket": S3_BUCKET, "Key": origen})
    cliente.delete_object(Bucket=S3_BUCKET, Key=origen)


def firmar_subida(tipo: str, nombre_categoria: str) -> dict:
    # Las imágenes se organizan por categoría: uploads/naturaleza/<id>.jpg -> approved/naturaleza/<id>.jpg
    nombre = f"{carpeta_de(nombre_categoria)}/{uuid.uuid4().hex}{TIPOS_PERMITIDOS[tipo]}"
    firma = cliente.generate_presigned_post(
        Bucket=S3_BUCKET,
        Key=f"{S3_CARPETA_SUBIDAS}{nombre}",
        Fields={"Content-Type": tipo},
        Conditions=[
            {"Content-Type": tipo},
            ["content-length-range", 1, TAMANO_MAXIMO],
        ],
        ExpiresIn=MINUTOS_PARA_SUBIR * 60,
    )
    # La URL final apunta a approved/: solo existirá si Rekognition aprueba la imagen
    return {"url_subida": firma["url"], "campos": firma["fields"],
            "url_imagen": url_de(f"{S3_CARPETA}{nombre}")}


def datos_del_archivo(clave: str) -> dict | None:
    try:
        objeto = cliente.head_object(Bucket=S3_BUCKET, Key=clave)
    except ClientError:
        return None
    return {"tamano": objeto["ContentLength"], "tipo": objeto.get("ContentType", "")}


def esperar_moderacion(clave: str) -> str:
    """Espera el veredicto de la Lambda: "aprobada", "rechazada" o "pendiente"."""
    nombre = clave[len(S3_CARPETA):]
    limite = time.monotonic() + SEGUNDOS_MODERACION
    while True:
        if datos_del_archivo(clave) is not None:
            return "aprobada"
        if datos_del_archivo(f"{S3_CARPETA_RECHAZADAS}{nombre}") is not None:
            return "rechazada"
        if time.monotonic() > limite:
            return "pendiente"
        time.sleep(1)


def borrar(clave: str):
    cliente.delete_object(Bucket=S3_BUCKET, Key=clave)


def subir_desde_disco(ruta: Path, clave: str, tipo: str):
    cliente.upload_file(str(ruta), S3_BUCKET, clave, ExtraArgs={"ContentType": tipo})
