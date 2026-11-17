import uuid
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.config import (MINUTOS_PARA_SUBIR, S3_BUCKET, S3_CARPETA, S3_REGION,
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


def clave_de(url: str) -> str | None:
    inicio = URL_BASE_S3 + S3_CARPETA
    if not url.startswith(inicio) or "/" in url[len(inicio):]:
        return None
    return url[len(URL_BASE_S3):]


def firmar_subida(tipo: str) -> dict:
    clave = f"{S3_CARPETA}{uuid.uuid4().hex}{TIPOS_PERMITIDOS[tipo]}"
    firma = cliente.generate_presigned_post(
        Bucket=S3_BUCKET,
        Key=clave,
        Fields={"Content-Type": tipo},
        Conditions=[
            {"Content-Type": tipo},
            ["content-length-range", 1, TAMANO_MAXIMO],
        ],
        ExpiresIn=MINUTOS_PARA_SUBIR * 60,
    )
    return {"url_subida": firma["url"], "campos": firma["fields"], "url_imagen": url_de(clave)}


def datos_del_archivo(clave: str) -> dict | None:
    try:
        objeto = cliente.head_object(Bucket=S3_BUCKET, Key=clave)
    except ClientError:
        return None
    return {"tamano": objeto["ContentLength"], "tipo": objeto.get("ContentType", "")}


def borrar(clave: str):
    cliente.delete_object(Bucket=S3_BUCKET, Key=clave)


def subir_desde_disco(ruta: Path, clave: str, tipo: str):
    cliente.upload_file(str(ruta), S3_BUCKET, clave, ExtraArgs={"ContentType": tipo})
