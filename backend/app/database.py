from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import URL_BASE_DATOS

motor = create_engine(URL_BASE_DATOS, connect_args={"check_same_thread": False})


@event.listens_for(motor, "connect")
def activar_claves_foraneas(conexion, _):
    cursor = conexion.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SesionLocal = sessionmaker(bind=motor, autoflush=False)


class Base(DeclarativeBase):
    pass


def actualizar_esquema():
    """Agrega columnas nuevas a una galeria.db que ya existía (SQLite no lo hace solo)."""
    with motor.begin() as conexion:
        columnas = [fila[1] for fila in conexion.exec_driver_sql("PRAGMA table_info(imagenes)")]
        if columnas and "vistas" not in columnas:
            conexion.exec_driver_sql("ALTER TABLE imagenes ADD COLUMN vistas INTEGER NOT NULL DEFAULT 0")


def obtener_sesion():
    sesion = SesionLocal()
    try:
        yield sesion
    finally:
        sesion.close()
