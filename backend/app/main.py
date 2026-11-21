from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ORIGENES_PERMITIDOS
from app.database import Base, SesionLocal, actualizar_esquema, motor
from app.datos_iniciales import cargar_datos_iniciales
from app.routers import auth, categorias, imagenes, usuarios


@asynccontextmanager
async def inicio(_: FastAPI):
    Base.metadata.create_all(motor)
    actualizar_esquema()
    with SesionLocal() as sesion:
        cargar_datos_iniciales(sesion)
    yield


app = FastAPI(title="Galería Cloud Segura · API", lifespan=inicio)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=ORIGENES_PERMITIDOS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(imagenes.router)
app.include_router(usuarios.router)
app.include_router(categorias.router)


@app.get("/")
def estado():
    return {"mensaje": "API de Galería Cloud Segura funcionando", "documentacion": "/docs"}
