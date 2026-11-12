from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import obtener_sesion
from app.schemas import ImagenActualizar, ImagenRespuesta, Visibilidad
from app.services import imagenes as servicio

router = APIRouter(prefix="/imagenes", tags=["Imágenes"])


@router.post("", response_model=ImagenRespuesta, status_code=201)
def registrar_imagen(
    titulo: Annotated[str, Form(min_length=2, max_length=120)],
    categoria_id: Annotated[int, Form()],
    usuario_id: Annotated[int, Form()],
    archivo: Annotated[UploadFile, File()],
    descripcion: Annotated[str, Form()] = "",
    visibilidad: Annotated[Visibilidad, Form()] = "Pública",
    sesion: Session = Depends(obtener_sesion),
):
    imagen = servicio.crear(sesion, titulo, descripcion, visibilidad, categoria_id, usuario_id, archivo)
    return servicio.a_respuesta(imagen)


@router.get("", response_model=list[ImagenRespuesta])
def consultar_imagenes(categoria_id: int | None = None, usuario_id: int | None = None,
                       sesion: Session = Depends(obtener_sesion)):
    return [servicio.a_respuesta(i) for i in servicio.listar(sesion, categoria_id, usuario_id)]


@router.get("/{imagen_id}", response_model=ImagenRespuesta)
def consultar_imagen(imagen_id: int, sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.buscar(sesion, imagen_id))


@router.put("/{imagen_id}", response_model=ImagenRespuesta)
def actualizar_imagen(imagen_id: int, datos: ImagenActualizar,
                      sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.actualizar(sesion, imagen_id, datos))


@router.delete("/{imagen_id}", status_code=204)
def eliminar_imagen(imagen_id: int, sesion: Session = Depends(obtener_sesion)):
    servicio.eliminar(sesion, imagen_id)
