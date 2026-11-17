from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Rol = Literal["Administrador", "Editor", "Usuario"]
Estado = Literal["Activo", "Inactivo", "Suspendido"]
Visibilidad = Literal["Pública", "Privada"]
Correo = str
PATRON_CORREO = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
PATRON_USUARIO = r"^[a-zA-Z0-9._-]{3,40}$"


class CategoriaCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    descripcion: str = ""


class CategoriaActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=60)
    descripcion: str | None = None


class CategoriaRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str
    total_imagenes: int = 0


class UsuarioCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    usuario: str = Field(pattern=PATRON_USUARIO)
    correo: Correo = Field(pattern=PATRON_CORREO)
    contrasena: str = Field(min_length=6)
    rol: Rol = "Usuario"
    estado: Estado = "Activo"


class UsuarioActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    usuario: str | None = Field(default=None, pattern=PATRON_USUARIO)
    correo: Correo | None = Field(default=None, pattern=PATRON_CORREO)
    contrasena: str | None = Field(default=None, min_length=6)
    rol: Rol | None = None
    estado: Estado | None = None


class UsuarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    usuario: str
    correo: str
    rol: str
    estado: str
    total_imagenes: int = 0


class RegistroUsuario(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    usuario: str = Field(pattern=PATRON_USUARIO)
    correo: Correo = Field(pattern=PATRON_CORREO)
    contrasena: str = Field(min_length=6)


class InicioSesion(BaseModel):
    identificador: str = Field(min_length=3)
    contrasena: str = Field(min_length=1)


class SolicitudSubida(BaseModel):
    tipo: str
    tamano: int = Field(gt=0)


class FirmaSubida(BaseModel):
    url_subida: str
    campos: dict[str, str]
    url_imagen: str


class ImagenCrear(BaseModel):
    titulo: str = Field(min_length=2, max_length=120)
    descripcion: str = ""
    visibilidad: Visibilidad = "Pública"
    categoria_id: int
    usuario_id: int
    url: str = Field(max_length=500)
    nombre_archivo: str = Field(min_length=1, max_length=200)


class ImagenActualizar(BaseModel):
    titulo: str | None = Field(default=None, min_length=2, max_length=120)
    descripcion: str | None = None
    visibilidad: Visibilidad | None = None
    categoria_id: int | None = None


class ImagenRespuesta(BaseModel):
    id: int
    titulo: str
    archivo: str
    url: str
    descripcion: str
    visibilidad: str
    formato: str
    tamano_kb: int
    fecha_registro: datetime
    categoria: CategoriaRespuesta
    usuario: UsuarioRespuesta
