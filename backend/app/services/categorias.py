from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Categoria
from app.schemas import CategoriaActualizar, CategoriaCrear, CategoriaRespuesta


def a_respuesta(categoria: Categoria) -> CategoriaRespuesta:
    return CategoriaRespuesta(
        id=categoria.id,
        nombre=categoria.nombre,
        descripcion=categoria.descripcion,
        total_imagenes=len(categoria.imagenes),
    )


def buscar(sesion: Session, categoria_id: int) -> Categoria:
    categoria = sesion.get(Categoria, categoria_id)
    if categoria is None:
        raise HTTPException(404, "La categoría no existe")
    return categoria


def revisar_nombre(sesion: Session, nombre: str, id_actual: int | None = None):
    otra = sesion.scalar(select(Categoria).where(Categoria.nombre == nombre))
    if otra is not None and otra.id != id_actual:
        raise HTTPException(409, "Ya existe una categoría con ese nombre")


def listar(sesion: Session) -> list[Categoria]:
    return list(sesion.scalars(select(Categoria).order_by(Categoria.nombre)))


def crear(sesion: Session, datos: CategoriaCrear) -> Categoria:
    revisar_nombre(sesion, datos.nombre)
    categoria = Categoria(nombre=datos.nombre, descripcion=datos.descripcion)
    sesion.add(categoria)
    sesion.commit()
    sesion.refresh(categoria)
    return categoria


def actualizar(sesion: Session, categoria_id: int, datos: CategoriaActualizar) -> Categoria:
    categoria = buscar(sesion, categoria_id)
    if datos.nombre is not None:
        revisar_nombre(sesion, datos.nombre, categoria.id)
        categoria.nombre = datos.nombre
    if datos.descripcion is not None:
        categoria.descripcion = datos.descripcion
    sesion.commit()
    sesion.refresh(categoria)
    return categoria


def eliminar(sesion: Session, categoria_id: int):
    categoria = buscar(sesion, categoria_id)
    if categoria.imagenes:
        raise HTTPException(409, "No se puede eliminar: la categoría tiene imágenes")
    sesion.delete(categoria)
    sesion.commit()
