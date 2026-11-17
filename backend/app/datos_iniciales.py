from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import s3
from app.config import CARPETA_BACKEND, S3_BUCKET, S3_CARPETA
from app.models import Categoria, Imagen, Usuario
from app.seguridad import cifrar_contrasena

CONTRASENA_DEMO = "muralia2026"

CATEGORIAS = [
    ("Naturaleza", "Paisajes, montañas, playas y bosques"),
    ("Arquitectura", "Edificios, iglesias y ciudades"),
    ("Arte", "Pintura, ilustración y obras artísticas"),
    ("Fotografía", "Fotos de autor"),
    ("Retratos", "Fotos de personas"),
    ("Viajes", "Lugares visitados"),
    ("Diseño", "Carteles y trabajos gráficos"),
]

USUARIOS = [
    ("Mateo Cantos", "mateo.cantos@muralia.com", "Administrador", "Activo"),
    ("Pedro Carranza", "pedro.carranza@muralia.com", "Administrador", "Activo"),
    ("Gabriel Terán", "gabriel.teran@muralia.com", "Editor", "Activo"),
    ("Laura Andrade", "laura.andrade@muralia.com", "Usuario", "Activo"),
    ("Sofía Ruiz", "sofia.ruiz@muralia.com", "Editor", "Inactivo"),
    ("Andrés Vega", "andres.vega@muralia.com", "Usuario", "Suspendido"),
]

# título, archivo de ejemplo, categoría, correo del responsable, visibilidad, descripción
IMAGENES = [
    ("Atardecer en la costa", "imagen-1.svg", "Naturaleza", "gabriel.teran@muralia.com", "Privada",
     "Fotografía tomada en la playa de Montañita durante la puesta de sol. Tonos cálidos y siluetas de montañas al fondo."),
    ("Calles de Cuenca", "imagen-2.svg", "Viajes", "gabriel.teran@muralia.com", "Pública", "Recorrido por el centro histórico."),
    ("Volcán Cotopaxi", "imagen-3.svg", "Fotografía", "pedro.carranza@muralia.com", "Pública", "El volcán al amanecer."),
    ("Catedral de Quito", "imagen-4.svg", "Arquitectura", "pedro.carranza@muralia.com", "Pública", "Vista desde la plaza."),
    ("Rosas del valle", "imagen-5.svg", "Arte", "mateo.cantos@muralia.com", "Pública", "Flores pintadas en tonos rosados."),
    ("Páramo andino", "imagen-6.svg", "Naturaleza", "mateo.cantos@muralia.com", "Pública", "Neblina sobre el páramo."),
    ("Dunas al atardecer", "imagen-7.svg", "Fotografía", "gabriel.teran@muralia.com", "Pública", "Arena y luz dorada."),
    ("Bosque nublado", "imagen-8.svg", "Naturaleza", "mateo.cantos@muralia.com", "Pública", "Bosque cubierto de nubes."),
    ("Laguna de Quilotoa", "imagen-9.svg", "Viajes", "pedro.carranza@muralia.com", "Pública", "La laguna desde el mirador."),
    ("Retrato en sepia", "imagen-10.svg", "Retratos", "gabriel.teran@muralia.com", "Privada", "Retrato en tonos antiguos."),
    ("Cartel minimalista", "imagen-11.svg", "Diseño", "mateo.cantos@muralia.com", "Privada", "Cartel con formas simples."),
    ("Iglesia de San Francisco", "imagen-12.svg", "Arquitectura", "gabriel.teran@muralia.com", "Pública", "Fachada de la iglesia."),
]

CARPETA_EJEMPLOS = CARPETA_BACKEND.parent / "02-galeria-principal" / "img"


def cargar_datos_iniciales(sesion: Session):
    if sesion.scalar(select(Usuario).limit(1)) is not None:
        return

    categorias = {n: Categoria(nombre=n, descripcion=d) for n, d in CATEGORIAS}
    usuarios = {
        c: Usuario(nombre=n, usuario=c.split("@")[0], correo=c,
                   contrasena=cifrar_contrasena(CONTRASENA_DEMO), rol=r, estado=e)
        for n, c, r, e in USUARIOS
    }
    sesion.add_all([*categorias.values(), *usuarios.values()])

    fecha = datetime(2026, 10, 2, 18, 42)
    for titulo, archivo, categoria, correo, visibilidad, descripcion in IMAGENES:
        origen = CARPETA_EJEMPLOS / archivo
        if not origen.exists():
            continue
        clave = f"{S3_CARPETA}ejemplo-{archivo}"
        try:
            s3.subir_desde_disco(origen, clave, "image/svg+xml")
        except s3.ErrorDeS3 as error:
            print(f"Aviso: no se pudieron subir las imágenes de ejemplo al bucket {S3_BUCKET}: {error}")
            break
        sesion.add(Imagen(
            titulo=titulo,
            url=s3.url_de(clave),
            nombre_archivo=archivo,
            formato="SVG",
            tamano_kb=round(origen.stat().st_size / 1024),
            descripcion=descripcion,
            visibilidad=visibilidad,
            fecha_registro=fecha,
            categoria=categorias[categoria],
            usuario=usuarios[correo],
        ))
        fecha -= timedelta(days=1, hours=3)
    sesion.commit()
