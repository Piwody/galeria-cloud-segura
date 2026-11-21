from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

Rol = Literal["Administrador", "Editor", "Usuario"]
Estado = Literal["Activo", "Inactivo", "Suspendido"]
Visibilidad = Literal["Pública", "Privada"]
Correo = str
PATRON_CORREO = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
# Usuario: de 3 a 40 caracteres, letras, números y símbolos, sin espacios ni @ (la @ es para el correo)
PATRON_USUARIO = r"^[^\s@]{3,40}$"
# Nombre y apellido: una sola palabra, solo letras (incluye tildes y ñ)
PATRON_LETRAS = r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,50}$"


def validar_contrasena(valor: str) -> str:
    if len(valor) < 8:
        raise ValueError("La contraseña debe tener mínimo 8 caracteres")
    if not any(c.isupper() for c in valor):
        raise ValueError("La contraseña debe tener al menos una letra mayúscula")
    if not any(c.isdigit() for c in valor):
        raise ValueError("La contraseña debe tener al menos un número")
    return valor


Contrasena = Annotated[str, AfterValidator(validar_contrasena)]


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
    contrasena: Contrasena
    rol: Rol = "Usuario"
    estado: Estado = "Activo"


class UsuarioActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    usuario: str | None = Field(default=None, pattern=PATRON_USUARIO)
    correo: Correo | None = Field(default=None, pattern=PATRON_CORREO)
    contrasena: Contrasena | None = None
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
    nombre: str = Field(pattern=PATRON_LETRAS)
    apellido: str = Field(pattern=PATRON_LETRAS)
    usuario: str = Field(pattern=PATRON_USUARIO)
    correo: Correo = Field(pattern=PATRON_CORREO)
    contrasena: Contrasena


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
    vistas: int = 0
    me_gusta: int = 0
    le_gusta: bool = False
    guardada: bool = False


class AccionUsuario(BaseModel):
    usuario_id: int
