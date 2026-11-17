from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import obtener_sesion
from app.schemas import (FirmaSubida, ImagenActualizar, ImagenCrear, ImagenRespuesta,
                         SolicitudSubida)
from app.services import imagenes as servicio

router = APIRouter(prefix="/imagenes", tags=["Imágenes"])


@router.post("/subida", response_model=FirmaSubida)
def pedir_permiso_de_subida(datos: SolicitudSubida):
    return servicio.firmar_subida(datos)


@router.post("", response_model=ImagenRespuesta, status_code=201)
def registrar_imagen(datos: ImagenCrear, sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.crear(sesion, datos))


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
