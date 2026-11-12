from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CARPETA_IMAGENES, ORIGENES_PERMITIDOS
from app.database import Base, SesionLocal, motor
from app.datos_iniciales import cargar_datos_iniciales
from app.routers import categorias, imagenes, usuarios


@asynccontextmanager
async def inicio(_: FastAPI):
    Base.metadata.create_all(motor)
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

CARPETA_IMAGENES.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=CARPETA_IMAGENES), name="uploads")

app.include_router(imagenes.router)
app.include_router(usuarios.router)
app.include_router(categorias.router)


@app.get("/")
def estado():
    return {"mensaje": "API de Galería Cloud Segura funcionando", "documentacion": "/docs"}
