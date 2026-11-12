from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Rol = Literal["Administrador", "Editor", "Usuario"]
Estado = Literal["Activo", "Inactivo", "Suspendido"]
Visibilidad = Literal["Pública", "Privada"]
Correo = str


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
    correo: Correo = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    contrasena: str = Field(min_length=6)
    rol: Rol = "Usuario"
    estado: Estado = "Activo"


class UsuarioActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    correo: Correo | None = Field(default=None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    contrasena: str | None = Field(default=None, min_length=6)
    rol: Rol | None = None
    estado: Estado | None = None


class UsuarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    correo: str
    rol: str
    estado: str
    total_imagenes: int = 0


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
