from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import s3
from app.config import TAMANO_MAXIMO, TIPOS_PERMITIDOS
from app.models import Imagen
from app.schemas import (FirmaSubida, ImagenActualizar, ImagenCrear, ImagenRespuesta,
                         SolicitudSubida)
from app.services import categorias, usuarios


def a_respuesta(imagen: Imagen) -> ImagenRespuesta:
    return ImagenRespuesta(
        id=imagen.id,
        titulo=imagen.titulo,
        archivo=imagen.nombre_archivo,
        url=imagen.url,
        descripcion=imagen.descripcion,
        visibilidad=imagen.visibilidad,
        formato=imagen.formato,
        tamano_kb=imagen.tamano_kb,
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


def firmar_subida(datos: SolicitudSubida) -> FirmaSubida:
    if datos.tipo not in TIPOS_PERMITIDOS:
        raise HTTPException(400, "Formato no permitido. Usa JPG, PNG, WEBP o SVG")
    if datos.tamano > TAMANO_MAXIMO:
        raise HTTPException(400, "La imagen pesa más de 10 MB")
    try:
        return FirmaSubida(**s3.firmar_subida(datos.tipo))
    except s3.ErrorDeS3:
        raise HTTPException(503, "El backend no pudo conectarse con AWS S3. Revisa las credenciales")


def crear(sesion: Session, datos: ImagenCrear) -> Imagen:
    categorias.buscar(sesion, datos.categoria_id)
    usuarios.buscar(sesion, datos.usuario_id)

    clave = s3.clave_de(datos.url)
    if clave is None:
        raise HTTPException(400, "La URL no pertenece al bucket de imágenes de Muralia")
    if sesion.scalar(select(Imagen).where(Imagen.url == datos.url)) is not None:
        raise HTTPException(409, "Esa imagen ya está registrada")

    try:
        archivo = s3.datos_del_archivo(clave)
    except s3.ErrorDeS3:
        raise HTTPException(503, "El backend no pudo conectarse con AWS S3. Revisa las credenciales")
    if archivo is None:
        raise HTTPException(400, "La imagen no se encuentra en S3. Vuelve a subirla")

    imagen = Imagen(
        titulo=datos.titulo,
        url=datos.url,
        nombre_archivo=datos.nombre_archivo,
        formato=clave.rsplit(".", 1)[-1].upper(),
        tamano_kb=round(archivo["tamano"] / 1024),
        descripcion=datos.descripcion,
        visibilidad=datos.visibilidad,
        categoria_id=datos.categoria_id,
        usuario_id=datos.usuario_id,
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
    clave = s3.clave_de(imagen.url)
    sesion.delete(imagen)
    sesion.commit()
    if clave is not None:
        try:
            s3.borrar(clave)
        except s3.ErrorDeS3:
            print(f"Aviso: no se pudo borrar {clave} de S3")
