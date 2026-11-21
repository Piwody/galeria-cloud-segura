from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import obtener_sesion
from app.schemas import InicioSesion, RegistroUsuario, UsuarioCrear, UsuarioRespuesta
from app.services import usuarios as servicio

router = APIRouter(prefix="/auth", tags=["Inicio de sesión"])


@router.post("/registro", response_model=UsuarioRespuesta, status_code=201)
def registrar_cuenta(datos: RegistroUsuario, sesion: Session = Depends(obtener_sesion)):
    # Se guarda "Nombre Apellido" para que las iniciales salgan de cada uno (ej. Gabriel Terán -> GT)
    nombre = f"{datos.nombre.capitalize()} {datos.apellido.capitalize()}"
    cuenta = datos.model_dump(exclude={"nombre", "apellido"})
    nuevo = UsuarioCrear(**cuenta, nombre=nombre, rol="Usuario", estado="Activo")
    return servicio.a_respuesta(servicio.crear(sesion, nuevo))


@router.post("/login", response_model=UsuarioRespuesta)
def iniciar_sesion(datos: InicioSesion, sesion: Session = Depends(obtener_sesion)):
    return servicio.a_respuesta(servicio.iniciar_sesion(sesion, datos))
