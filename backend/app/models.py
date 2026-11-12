from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
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
    archivo: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str] = mapped_column(Text, default="")
    visibilidad: Mapped[str] = mapped_column(String(10), default="Pública")
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))

    categoria: Mapped[Categoria] = relationship(back_populates="imagenes")
    usuario: Mapped[Usuario] = relationship(back_populates="imagenes")
