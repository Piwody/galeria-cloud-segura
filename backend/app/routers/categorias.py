from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import obtener_sesion
from app.schemas import CategoriaActualizar, CategoriaCrear, CategoriaRespuesta
from app.services import categorias as servicio

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.post("", response_model=CategoriaRespuesta, status_code=201)
def registrar_categoria(datos: CategoriaCrear, sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.crear(sesion, datos))


@router.get("", response_model=list[CategoriaRespuesta])
def consultar_categorias(sesion: Session = Depends(obtener_sesion)):
    return [servicio.a_respuesta(c) for c in servicio.listar(sesion)]


@router.get("/{categoria_id}", response_model=CategoriaRespuesta)
def consultar_categoria(categoria_id: int, sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.buscar(sesion, categoria_id))


@router.put("/{categoria_id}", response_model=CategoriaRespuesta)
def actualizar_categoria(categoria_id: int, datos: CategoriaActualizar,
                         sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.actualizar(sesion, categoria_id, datos))


@router.delete("/{categoria_id}", status_code=204)
def eliminar_categoria(categoria_id: int, sesion: Session = Depends(obtener_sesion)):
    servicio.eliminar(sesion, categoria_id)
