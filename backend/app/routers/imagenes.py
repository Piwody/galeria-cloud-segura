from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import obtener_sesion
from app.schemas import (AccionUsuario, FirmaSubida, ImagenActualizar, ImagenCrear,
                         ImagenRespuesta, SolicitudSubida)
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
                       visitante_id: int | None = None,
                       sesion: Session = Depends(obtener_sesion)):
    imagenes = servicio.listar(sesion, categoria_id, usuario_id)
    return [servicio.a_respuesta(i, visitante_id) for i in imagenes]


@router.get("/guardadas", response_model=list[ImagenRespuesta])
def consultar_guardadas(usuario_id: int, sesion: Session = Depends(obtener_sesion)):
    return [servicio.a_respuesta(i, usuario_id) for i in servicio.listar_guardadas(sesion, usuario_id)]


@router.get("/me-gusta", response_model=list[ImagenRespuesta])
def consultar_me_gusta(usuario_id: int, sesion: Session = Depends(obtener_sesion)):
    return [servicio.a_respuesta(i, usuario_id) for i in servicio.listar_con_me_gusta(sesion, usuario_id)]


@router.get("/{imagen_id}", response_model=ImagenRespuesta)
def consultar_imagen(imagen_id: int, visitante_id: int | None = None, contar_vista: bool = False,
                     sesion: Session = Depends(obtener_sesion)):
    imagen = servicio.buscar(sesion, imagen_id)
    if contar_vista:
        servicio.sumar_vista(sesion, imagen)
    return servicio.a_respuesta(imagen, visitante_id)


@router.post("/{imagen_id}/me-gusta", response_model=ImagenRespuesta)
def dar_o_quitar_me_gusta(imagen_id: int, datos: AccionUsuario,
                          sesion: Session = Depends(obtener_sesion)):
    imagen = servicio.alternar_me_gusta(sesion, imagen_id, datos.usuario_id)
    return servicio.a_respuesta(imagen, datos.usuario_id)


@router.post("/{imagen_id}/guardar", response_model=ImagenRespuesta)
def guardar_o_quitar(imagen_id: int, datos: AccionUsuario,
                     sesion: Session = Depends(obtener_sesion)):
    imagen = servicio.alternar_guardada(sesion, imagen_id, datos.usuario_id)
    return servicio.a_respuesta(imagen, datos.usuario_id)


@router.put("/{imagen_id}", response_model=ImagenRespuesta)
def actualizar_imagen(imagen_id: int, datos: ImagenActualizar, usuario_id: int,
                      sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.actualizar(sesion, imagen_id, datos, usuario_id), usuario_id)


@router.delete("/{imagen_id}", status_code=204)
def eliminar_imagen(imagen_id: int, usuario_id: int, sesion: Session = Depends(obtener_sesion)):
    servicio.eliminar(sesion, imagen_id, usuario_id)
