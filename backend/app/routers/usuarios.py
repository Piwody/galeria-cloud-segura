from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import obtener_sesion
from app.schemas import UsuarioActualizar, UsuarioCrear, UsuarioRespuesta
from app.services import usuarios as servicio

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("", response_model=UsuarioRespuesta, status_code=201)
def registrar_usuario(datos: UsuarioCrear, sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.crear(sesion, datos))


@router.get("", response_model=list[UsuarioRespuesta])
def consultar_usuarios(sesion: Session = Depends(obtener_sesion)):
    return [servicio.a_respuesta(u) for u in servicio.listar(sesion)]


@router.get("/{usuario_id}", response_model=UsuarioRespuesta)
def consultar_usuario(usuario_id: int, sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.buscar(sesion, usuario_id))


@router.put("/{usuario_id}", response_model=UsuarioRespuesta)
def actualizar_usuario(usuario_id: int, datos: UsuarioActualizar,
                       sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.actualizar(sesion, usuario_id, datos))


@router.delete("/{usuario_id}", status_code=204)
def eliminar_usuario(usuario_id: int, sesion: Session = Depends(obtener_sesion)):
    servicio.eliminar(sesion, usuario_id)
