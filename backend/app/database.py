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


def obtener_sesion():
    sesion = SesionLocal()
    try:
        yield sesion
    finally:
        sesion.close()
