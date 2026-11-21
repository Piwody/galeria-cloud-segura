from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import s3
from app.config import TAMANO_MAXIMO, TIPOS_PERMITIDOS
from app.models import Favorito, Imagen, MeGusta
from app.schemas import (FirmaSubida, ImagenActualizar, ImagenCrear, ImagenRespuesta,
                         SolicitudSubida)
from app.services import categorias, usuarios


def a_respuesta(imagen: Imagen, visitante_id: int | None = None) -> ImagenRespuesta:
    """visitante_id es el usuario que está mirando: sirve para saber si ya le dio me gusta o la guardó."""
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
        vistas=imagen.vistas or 0,
        me_gusta=len(imagen.me_gusta),
        le_gusta=any(m.usuario_id == visitante_id for m in imagen.me_gusta),
        guardada=any(f.usuario_id == visitante_id for f in imagen.favoritos),
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


def listar_guardadas(sesion: Session, usuario_id: int) -> list[Imagen]:
    usuarios.buscar(sesion, usuario_id)
    consulta = (select(Imagen).join(Favorito, Favorito.imagen_id == Imagen.id)
                .where(Favorito.usuario_id == usuario_id).order_by(Favorito.fecha.desc()))
    return list(sesion.scalars(consulta))


def listar_con_me_gusta(sesion: Session, usuario_id: int) -> list[Imagen]:
    usuarios.buscar(sesion, usuario_id)
    consulta = (select(Imagen).join(MeGusta, MeGusta.imagen_id == Imagen.id)
                .where(MeGusta.usuario_id == usuario_id).order_by(MeGusta.fecha.desc()))
    return list(sesion.scalars(consulta))


def sumar_vista(sesion: Session, imagen: Imagen):
    imagen.vistas = (imagen.vistas or 0) + 1
    sesion.commit()


def _alternar(sesion: Session, modelo, imagen_id: int, usuario_id: int) -> Imagen:
    imagen = buscar(sesion, imagen_id)
    usuarios.buscar(sesion, usuario_id)
    existente = sesion.get(modelo, (usuario_id, imagen_id))
    if existente is None:
        sesion.add(modelo(usuario_id=usuario_id, imagen_id=imagen_id))
    else:
        sesion.delete(existente)
    sesion.commit()
    sesion.refresh(imagen)
    return imagen


def alternar_me_gusta(sesion: Session, imagen_id: int, usuario_id: int) -> Imagen:
    return _alternar(sesion, MeGusta, imagen_id, usuario_id)


def alternar_guardada(sesion: Session, imagen_id: int, usuario_id: int) -> Imagen:
    return _alternar(sesion, Favorito, imagen_id, usuario_id)


def verificar_autor(imagen: Imagen, usuario_id: int):
    if imagen.usuario_id != usuario_id:
        raise HTTPException(403, "Solo el autor de la imagen puede editarla o eliminarla")


def firmar_subida(datos: SolicitudSubida) -> FirmaSubida:
    if datos.tipo not in TIPOS_PERMITIDOS:
        raise HTTPException(400, "Formato no permitido. Usa JPG, PNG o WEBP")
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
        estado = s3.esperar_moderacion(clave)
    except s3.ErrorDeS3:
        raise HTTPException(503, "El backend no pudo conectarse con AWS S3. Revisa las credenciales")
    if estado == "rechazada":
        raise HTTPException(400, "La imagen fue rechazada por la moderación automática: "
                                 "tiene contenido no apropiado o no es una imagen válida")
    if estado == "pendiente":
        raise HTTPException(503, "La imagen sigue en revisión. Intenta registrarla de nuevo en unos segundos")

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


def actualizar(sesion: Session, imagen_id: int, datos: ImagenActualizar, usuario_id: int) -> Imagen:
    imagen = buscar(sesion, imagen_id)
    verificar_autor(imagen, usuario_id)
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


def eliminar(sesion: Session, imagen_id: int, usuario_id: int):
    imagen = buscar(sesion, imagen_id)
    verificar_autor(imagen, usuario_id)
    clave = s3.clave_de(imagen.url)
    sesion.delete(imagen)
    sesion.commit()
    if clave is not None:
        try:
            s3.borrar(clave)
        except s3.ErrorDeS3:
            print(f"Aviso: no se pudo borrar {clave} de S3")
