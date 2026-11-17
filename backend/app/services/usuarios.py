from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Usuario
from app.schemas import InicioSesion, UsuarioActualizar, UsuarioCrear, UsuarioRespuesta
from app.seguridad import cifrar_contrasena, verificar_contrasena


def a_respuesta(usuario: Usuario) -> UsuarioRespuesta:
    return UsuarioRespuesta(
        id=usuario.id,
        nombre=usuario.nombre,
        usuario=usuario.usuario,
        correo=usuario.correo,
        rol=usuario.rol,
        estado=usuario.estado,
        total_imagenes=len(usuario.imagenes),
    )


def buscar(sesion: Session, usuario_id: int) -> Usuario:
    usuario = sesion.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(404, "El usuario no existe")
    return usuario


def revisar_correo(sesion: Session, correo: str, id_actual: int | None = None):
    otro = sesion.scalar(select(Usuario).where(Usuario.correo == correo))
    if otro is not None and otro.id != id_actual:
        raise HTTPException(409, "Ya existe una cuenta registrada con ese correo")


def revisar_usuario(sesion: Session, nombre_usuario: str, id_actual: int | None = None):
    otro = sesion.scalar(select(Usuario).where(Usuario.usuario == nombre_usuario))
    if otro is not None and otro.id != id_actual:
        raise HTTPException(409, "Ese nombre de usuario ya está en uso")


def listar(sesion: Session) -> list[Usuario]:
    return list(sesion.scalars(select(Usuario).order_by(Usuario.id)))


def crear(sesion: Session, datos: UsuarioCrear) -> Usuario:
    correo = datos.correo.lower()
    nombre_usuario = datos.usuario.lower()
    revisar_correo(sesion, correo)
    revisar_usuario(sesion, nombre_usuario)
    usuario = Usuario(
        nombre=datos.nombre,
        usuario=nombre_usuario,
        correo=correo,
        contrasena=cifrar_contrasena(datos.contrasena),
        rol=datos.rol,
        estado=datos.estado,
    )
    sesion.add(usuario)
    sesion.commit()
    sesion.refresh(usuario)
    return usuario


def actualizar(sesion: Session, usuario_id: int, datos: UsuarioActualizar) -> Usuario:
    usuario = buscar(sesion, usuario_id)
    if datos.correo is not None:
        correo = datos.correo.lower()
        revisar_correo(sesion, correo, usuario.id)
        usuario.correo = correo
    if datos.usuario is not None:
        nombre_usuario = datos.usuario.lower()
        revisar_usuario(sesion, nombre_usuario, usuario.id)
        usuario.usuario = nombre_usuario
    if datos.nombre is not None:
        usuario.nombre = datos.nombre
    if datos.contrasena is not None:
        usuario.contrasena = cifrar_contrasena(datos.contrasena)
    if datos.rol is not None:
        usuario.rol = datos.rol
    if datos.estado is not None:
        usuario.estado = datos.estado
    sesion.commit()
    sesion.refresh(usuario)
    return usuario


def eliminar(sesion: Session, usuario_id: int):
    usuario = buscar(sesion, usuario_id)
    if usuario.imagenes:
        raise HTTPException(409, "No se puede eliminar: el usuario tiene imágenes registradas")
    sesion.delete(usuario)
    sesion.commit()


def iniciar_sesion(sesion: Session, datos: InicioSesion) -> Usuario:
    identificador = datos.identificador.strip().lower()
    usuario = sesion.scalar(select(Usuario).where(
        or_(Usuario.correo == identificador, Usuario.usuario == identificador)
    ))
    if usuario is None or not verificar_contrasena(datos.contrasena, usuario.contrasena):
        raise HTTPException(401, "Correo, usuario o contraseña incorrectos")
    if usuario.estado != "Activo":
        raise HTTPException(403, f"Tu cuenta está {usuario.estado.lower()[:-1]}a. Habla con un administrador")
    return usuario
