import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import CARPETA_IMAGENES, EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO
from app.models import Imagen
from app.schemas import ImagenActualizar, ImagenRespuesta
from app.services import categorias, usuarios


def a_respuesta(imagen: Imagen) -> ImagenRespuesta:
    ruta = CARPETA_IMAGENES / imagen.archivo
    tamano = ruta.stat().st_size if ruta.exists() else 0
    return ImagenRespuesta(
        id=imagen.id,
        titulo=imagen.titulo,
        archivo=imagen.archivo,
        url=f"/uploads/{imagen.archivo}",
        descripcion=imagen.descripcion,
        visibilidad=imagen.visibilidad,
        formato=Path(imagen.archivo).suffix.lstrip(".").upper(),
        tamano_kb=round(tamano / 1024),
        fecha_registro=imagen.fecha_registro,
        categoria=categorias.a_respuesta(imagen.categoria),
        usuario=usuarios.a_respuesta(imagen.usuario),
    )


def buscar(sesion: Session, imagen_id: int) -> Imagen:
    imagen = sesion.get(Imagen, imagen_id)
    if imagen is None:
        raise HTTPException(404, "La imagen no existe")
    return imagen


def listar(sesion: Session, categoria_id: int | None, usuario_id: int | None) -> list[Imagen]:
    consulta = select(Imagen).order_by(Imagen.fecha_registro.desc())
    if categoria_id is not None:
        consulta = consulta.where(Imagen.categoria_id == categoria_id)
    if usuario_id is not None:
        consulta = consulta.where(Imagen.usuario_id == usuario_id)
    return list(sesion.scalars(consulta))


def guardar_archivo(archivo: UploadFile) -> str:
    extension = Path(archivo.filename or "").suffix.lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(400, "Formato no permitido. Usa JPG, PNG, WEBP o SVG")
    contenido = archivo.file.read(TAMANO_MAXIMO + 1)
    if len(contenido) > TAMANO_MAXIMO:
        raise HTTPException(400, "La imagen pesa más de 10 MB")
    nombre = f"{uuid.uuid4().hex}{extension}"
    CARPETA_IMAGENES.mkdir(exist_ok=True)
    (CARPETA_IMAGENES / nombre).write_bytes(contenido)
    return nombre


def crear(sesion: Session, titulo: str, descripcion: str, visibilidad: str,
          categoria_id: int, usuario_id: int, archivo: UploadFile) -> Imagen:
    categorias.buscar(sesion, categoria_id)
    usuarios.buscar(sesion, usuario_id)
    imagen = Imagen(
        titulo=titulo,
        archivo=guardar_archivo(archivo),
        descripcion=descripcion,
        visibilidad=visibilidad,
        categoria_id=categoria_id,
        usuario_id=usuario_id,
    )
    sesion.add(imagen)
    sesion.commit()
    sesion.refresh(imagen)
    return imagen


def actualizar(sesion: Session, imagen_id: int, datos: ImagenActualizar) -> Imagen:
    imagen = buscar(sesion, imagen_id)
    if datos.categoria_id is not None:
        categorias.buscar(sesion, datos.categoria_id)
        imagen.categoria_id = datos.categoria_id
    if datos.titulo is not None:
        imagen.titulo = datos.titulo
    if datos.descripcion is not None:
        imagen.descripcion = datos.descripcion
    if datos.visibilidad is not None:
        imagen.visibilidad = datos.visibilidad
    sesion.commit()
    sesion.refresh(imagen)
    return imagen


def eliminar(sesion: Session, imagen_id: int):
    imagen = buscar(sesion, imagen_id)
    ruta = CARPETA_IMAGENES / imagen.archivo
    sesion.delete(imagen)
    sesion.commit()
    ruta.unlink(missing_ok=True)
