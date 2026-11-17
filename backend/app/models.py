from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    usuario: Mapped[str] = mapped_column(String(40), unique=True)
    correo: Mapped[str] = mapped_column(String(120), unique=True)
    contrasena: Mapped[str] = mapped_column(String(200))
    rol: Mapped[str] = mapped_column(String(20), default="Usuario")
    estado: Mapped[str] = mapped_column(String(20), default="Activo")

    imagenes: Mapped[list["Imagen"]] = relationship(back_populates="usuario")


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True)
    descripcion: Mapped[str] = mapped_column(Text, default="")

    imagenes: Mapped[list["Imagen"]] = relationship(back_populates="categoria")


class Imagen(Base):
    __tablename__ = "imagenes"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(String(500), unique=True)
    nombre_archivo: Mapped[str] = mapped_column(String(200))
    formato: Mapped[str] = mapped_column(String(10))
    tamano_kb: Mapped[int] = mapped_column(Integer)
    descripcion: Mapped[str] = mapped_column(Text, default="")
    visibilidad: Mapped[str] = mapped_column(String(10), default="Pública")
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))

    categoria: Mapped[Categoria] = relationship(back_populates="imagenes")
    usuario: Mapped[Usuario] = relationship(back_populates="imagenes")
