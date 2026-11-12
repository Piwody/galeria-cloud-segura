# Muralia · Galería Cloud Segura

Proyecto Integrador 2026 · Programación Web · UIDE

## ¿Qué es el Proyecto Integrador?

Es el proyecto del semestre donde aplicamos lo aprendido en la materia de Programación Web. Partimos de los mockups que diseñamos en Figma, los convertimos en páginas web reales y ahora las conectamos a un backend con base de datos.

## ¿Qué es Muralia?

Muralia es una **galería de imágenes** donde cada persona puede subir, ver y descargar fotos. Cada imagen tiene su título, descripción, categoría, visibilidad, fecha de registro y un usuario responsable.

La aplicación tiene tres roles:

| Rol | Qué puede hacer |
|---|---|
| **Usuario** | Ver, descargar y guardar imágenes |
| **Editor** | Lo mismo que el usuario, y además editar la información de sus propias imágenes |
| **Administrador** | Todo lo anterior, eliminar cualquier imagen y gestionar las cuentas de usuarios (roles y estados) |

## Arquitectura (Avance 3)

```
Navegador ──► Frontend (HTML, CSS y JavaScript) publicado en Amazon S3
                 │  fetch()
                 ▼
             Backend FastAPI en el computador (http://localhost:8000)
                 │  SQLAlchemy
                 ▼
             Base de datos SQLite (backend/galeria.db)
             Imágenes subidas (backend/uploads/)
```

- El **frontend** se publica en Amazon S3 como sitio web estático.
- El **backend** y la **base de datos** corren en el computador del equipo.
- El archivo [api.js](api.js) tiene la dirección del backend y las funciones que usan todas las páginas para hablar con la API.

## Estructura del proyecto

```
galeria-cloud-segura/
├── index.html                 Redirige al inicio de sesión
├── api.js                     Conexión del frontend con la API
├── 01-inicio-sesion/ … 08-seguridad/   Una carpeta por pantalla
├── despliegue/
│   └── politica-bucket.json   Permiso de lectura pública para S3
└── backend/
    ├── requirements.txt
    └── app/
        ├── main.py            Crea la API, CORS y carpeta de imágenes
        ├── config.py          Rutas, orígenes permitidos y límites
        ├── database.py        Conexión a SQLite
        ├── models.py          Tablas: usuarios, categorías, imágenes
        ├── schemas.py         Datos que entran y salen de la API
        ├── seguridad.py       Cifrado de contraseñas
        ├── datos_iniciales.py Datos de ejemplo de la primera vez
        ├── routers/           Endpoints de cada recurso
        └── services/          Lógica de negocio de cada recurso
```

## Modelo de datos (SQLite)

| Tabla | Campos |
|---|---|
| **usuarios** | id, nombre, correo (único), contrasena (cifrada con PBKDF2), rol, estado |
| **categorias** | id, nombre (único), descripcion |
| **imagenes** | id, titulo, archivo, descripcion, visibilidad, fecha_registro, **categoria_id**, **usuario_id** |

Relaciones:

- Un usuario registra muchas imágenes (`imagenes.usuario_id → usuarios.id`).
- Una categoría tiene muchas imágenes (`imagenes.categoria_id → categorias.id`).
- No se puede borrar un usuario ni una categoría que todavía tengan imágenes.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/imagenes` | Registra una imagen (formulario con archivo) |
| GET | `/imagenes` | Lista las imágenes (filtros opcionales `?categoria_id=` y `?usuario_id=`) |
| GET | `/imagenes/{id}` | Detalle de una imagen |
| PUT | `/imagenes/{id}` | Actualiza título, descripción, visibilidad o categoría |
| DELETE | `/imagenes/{id}` | Elimina la imagen y su archivo |
| POST | `/usuarios` | Registra un usuario |
| GET | `/usuarios` | Lista los usuarios |
| GET | `/usuarios/{id}` | Detalle de un usuario |
| PUT | `/usuarios/{id}` | Actualiza nombre, correo, contraseña, rol o estado |
| DELETE | `/usuarios/{id}` | Elimina un usuario |
| POST | `/categorias` | Registra una categoría |
| GET | `/categorias` | Lista las categorías |
| GET | `/categorias/{id}` | Detalle de una categoría |
| PUT | `/categorias/{id}` | Actualiza una categoría |
| DELETE | `/categorias/{id}` | Elimina una categoría |

Con el backend encendido, la documentación interactiva está en http://localhost:8000/docs.

## Qué pantallas usan la API

| Pantalla | Qué hace con la API |
|---|---|
| `02` Galería | Lista las imágenes y las categorías, y filtra por categoría |
| `03` Registro | Registra imágenes, crea categorías nuevas y edita imágenes (`?id=`) |
| `04` Detalle | Muestra una imagen (`?id=`), otras del mismo autor y la elimina |
| `05` Usuarios | Lista, registra, edita, suspende y elimina usuarios |

Las pantallas `01`, `06`, `07` y `08` siguen siendo solo diseño. Todavía no hay inicio de sesión real: las imágenes nuevas se registran a nombre del usuario 1 (Mateo Cantos).

## Cómo ejecutar el backend

Desde la carpeta `backend`:

```bash
pip install -r requirements.txt
```

```bash
python -m uvicorn app.main:app --reload
```

La primera vez se crea `galeria.db` con 7 categorías, 6 usuarios y 12 imágenes de ejemplo. La contraseña de los usuarios de ejemplo es `muralia2026`. Para empezar de cero, borra `backend/galeria.db` y la carpeta `backend/uploads`.

## Cómo ver el frontend en el computador

Abre la carpeta del proyecto en VS Code y abre cualquier `index.html` con **Live Server**. El backend debe estar encendido.

## Sitio publicado en Amazon S3

http://muraliacloudintegrador.s3-website.us-east-2.amazonaws.com

- Bucket: `muraliacloudintegrador`, región `us-east-2` (Ohio).
- Para que la página cargue datos, el backend tiene que estar encendido en el mismo computador donde se abre el enlace.
- La primera vez, el navegador puede bloquear la conexión con `localhost`. En Chrome o Brave, haz clic en el ícono de la barra de direcciones, permite el **acceso a la red local** y recarga la página.

## Cómo publicar el frontend en Amazon S3

1. En la consola de AWS entra a **S3** y crea un bucket, por ejemplo `muraliacloudintegrador`.
2. En **Bloquear acceso público**, desmarca la opción y confirma.
3. Sube el contenido de la carpeta del proyecto **menos la carpeta `backend`**: `index.html`, `api.js` y las carpetas `01-…` a `08-…`. Arrastra las carpetas completas para que se conserven las rutas.
4. En **Propiedades → Alojamiento de sitios web estáticos**, actívalo con documento de índice `index.html`.
5. En **Permisos → Política del bucket**, pega [politica-bucket.json](despliegue/politica-bucket.json). Si usas otro bucket, cambia `muraliacloudintegrador` por su nombre.
6. Abre el **punto de enlace del sitio web** que aparece en Propiedades (`http://…s3-website-…amazonaws.com`).

El backend ya acepta peticiones (CORS) de cualquier dirección `s3-website` de AWS y de `localhost`, así que no hay que cambiar nada para conectar el sitio de S3 con el backend local. El backend debe estar encendido en el mismo computador donde abres la página.

## Tecnologías

- **HTML5 y CSS3**: estructura y estilos, con Flexbox, Grid y media queries.
- **JavaScript**: `fetch()` para comunicarse con la API.
- **Python, FastAPI y Uvicorn**: la API.
- **SQLAlchemy y SQLite**: la base de datos local.
- **Amazon S3**: publicación del frontend.
- **Google Fonts**: Bodoni Moda para los títulos y Arimo para el texto.
- **Figma**: el diseño de los mockups y los íconos.
- **Git y GitHub**: trabajo en equipo y control de versiones.

## Guía de estilo

| Color | Código |
|---|---|
| Crema | `#FFEFB3` |
| Verde oscuro | `#013E37` |
| Verde | `#0A5A50` |
| Vino | `#963F38` |
| Fondo | `#FBF8EF` |
| Borde | `#E6E0CF` |
| Texto secundario | `#5E6F6B` |

## Equipo

- Mateo Cantos
- Gabriel Terán
- Pedro Carranza
