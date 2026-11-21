import os

import boto3
from sqlalchemy import URL, create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import (DB_MODO, RDS_BASE, RDS_HOST, RDS_INSTANCIA, RDS_PUERTO, RDS_REGION,
                        RDS_USUARIO, URL_BASE_DATOS)


def _motor_sqlite():
    motor = create_engine(URL_BASE_DATOS, connect_args={"check_same_thread": False})

    @event.listens_for(motor, "connect")
    def activar_claves_foraneas(conexion, _):
        cursor = conexion.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return motor


def _buscar_host_rds() -> str:
    try:
        rds = boto3.client("rds", region_name=RDS_REGION)
        instancia = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCIA)["DBInstances"][0]
        return instancia["Endpoint"]["Address"]
    except Exception as error:
        raise RuntimeError(
            f"No se encontró la base de datos RDS '{RDS_INSTANCIA}'. Revisa que hiciste 'aws configure' "
            f"con tu clave y que la instancia está encendida. Detalle: {error}"
        ) from error


def _motor_rds():
    host = RDS_HOST or _buscar_host_rds()
    url = URL.create("postgresql+psycopg", username=RDS_USUARIO, host=host, port=RDS_PUERTO,
                     database=RDS_BASE, query={"sslmode": "require", "connect_timeout": "10"})
    # pool_recycle: el token IAM dura 15 minutos, así que las conexiones se renuevan antes
    motor = create_engine(url, pool_pre_ping=True, pool_recycle=600)
    rds = boto3.client("rds", region_name=RDS_REGION)

    @event.listens_for(motor, "do_connect")
    def usar_token_iam(dialecto, registro, argumentos, parametros):
        # En vez de una contraseña fija, cada conexión usa un token firmado con la clave IAM de quien corre el backend
        parametros["password"] = rds.generate_db_auth_token(
            DBHostname=host, Port=RDS_PUERTO, DBUsername=RDS_USUARIO, Region=RDS_REGION)

    return motor


def _crear_motor():
    url_directa = os.getenv("MURALIA_DB_URL")  # solo para pruebas: una URL completa de base de datos
    if url_directa:
        return create_engine(url_directa, pool_pre_ping=True)
    if DB_MODO == "sqlite":
        return _motor_sqlite()
    return _motor_rds()


motor = _crear_motor()
SesionLocal = sessionmaker(bind=motor, autoflush=False)


class Base(DeclarativeBase):
    pass


def actualizar_esquema():
    """Agrega columnas nuevas a una galeria.db que ya existía (SQLite no lo hace solo).
    En PostgreSQL las tablas se crean completas desde el inicio."""
    if motor.dialect.name != "sqlite":
        return
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
