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

## Arquitectura

```
Navegador ──► Frontend (HTML, CSS y JavaScript) publicado en S3 (muralia-app-913051689392)
   │
   │ 1. POST /imagenes/subida  ──► FastAPI firma un permiso de 5 minutos
   │ 2. POST directo a S3       ──► el archivo se guarda en el bucket muralia-media-913051689392
   │ 3. POST /imagenes (URL de S3 + datos del formulario) ──► FastAPI
   ▼
Backend FastAPI en el computador (http://localhost:8000)
   │  SQLAlchemy
   ▼
Base de datos SQLite (backend/galeria.db): usuarios, categorías, me gusta, guardados
y datos de las imágenes (con su URL de S3)
```

- Los **archivos de imagen** se guardan en Amazon S3. El navegador los sube **directo a S3** al hacer clic en "Registrar imagen".
- El backend **no recibe el archivo**: solo firma el permiso de subida, comprueba que el archivo esté en S3 y guarda su URL en la base.
- Las **credenciales de AWS** solo las tiene el backend (`aws configure`). Nunca llegan al frontend.
- **Los datos** (usuarios, categorías, me gusta, guardados, imágenes) se guardan en la base SQLite local. Cada computador tiene su propio `galeria.db`; los archivos de las fotos sí son compartidos porque están en S3.

## Estructura del proyecto

```
galeria-cloud-segura/
├── index.html                 Redirige al inicio de sesión
├── api.js                     Conexión del frontend con la API
├── 01-inicio-sesion/ … 08-seguridad/   Una carpeta por pantalla
├── despliegue/
│   ├── politica-bucket.json            Lectura pública del sitio web
│   ├── politica-bucket-imagenes.json   Lectura pública de la carpeta imagenes/
│   ├── cors-bucket-imagenes.json       Permite que el navegador suba a S3
│   └── politica-iam-backend.json       Permisos mínimos del usuario IAM del backend
└── backend/
    ├── requirements.txt
    └── app/
        ├── main.py            Crea la API, CORS y carpeta de imágenes
        ├── config.py          Rutas, orígenes permitidos y límites
        ├── database.py        Conexión a SQLite (o a RDS PostgreSQL, opcional)
        ├── models.py          Tablas: usuarios, categorías, imágenes
        ├── schemas.py         Datos que entran y salen de la API
        ├── seguridad.py       Cifrado de contraseñas
        ├── s3.py              Conexión con Amazon S3 (firmar subidas, comprobar y borrar)
        ├── datos_iniciales.py Datos de ejemplo de la primera vez
        ├── routers/           Endpoints de cada recurso
        └── services/          Lógica de negocio de cada recurso
```

## Modelo de datos (SQLite)

| Tabla | Campos |
|---|---|
| **usuarios** | id, nombre, usuario (único), correo (único), contrasena (cifrada con PBKDF2), rol, estado |
| **categorias** | id, nombre (único), descripcion |
| **imagenes** | id, titulo, **url** (dirección en S3), nombre_archivo, formato, tamano_kb, descripcion, visibilidad, fecha_registro, **categoria_id**, **usuario_id** |

Relaciones:

- Un usuario registra muchas imágenes (`imagenes.usuario_id → usuarios.id`).
- Una categoría tiene muchas imágenes (`imagenes.categoria_id → categorias.id`).
- No se puede borrar un usuario ni una categoría que todavía tengan imágenes.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/auth/registro` | Crea una cuenta nueva (rol Usuario). Revisa que el correo y el usuario no existan |
| POST | `/auth/login` | Inicia sesión con correo o usuario y contraseña |
| POST | `/imagenes/subida` | Devuelve el permiso temporal para subir un archivo a S3 |
| POST | `/imagenes` | Registra una imagen con la URL de S3 y los datos del formulario |
| GET | `/imagenes` | Lista las imágenes (filtros opcionales `?categoria_id=` y `?usuario_id=`) |
| GET | `/imagenes/{id}` | Detalle de una imagen |
| PUT | `/imagenes/{id}` | Actualiza título, descripción, visibilidad o categoría |
| DELETE | `/imagenes/{id}` | Elimina la imagen de la base y su archivo de S3 |
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

| `01` Inicio de sesión | Inicia sesión y registra usuarios nuevos |

Las pantallas `06`, `07` y `08` siguen siendo solo diseño. Las imágenes nuevas se registran a nombre del usuario que inició sesión.

## Cómo ejecutar el backend

Desde la carpeta `backend`:

```bash
pip install -r requirements.txt
```

```bash
python -m uvicorn app.main:app --reload
```

La primera vez se crea `galeria.db` con 7 categorías, 6 usuarios y 12 imágenes de ejemplo (que se suben a S3, cada una en la carpeta de su categoría). La contraseña de los usuarios de ejemplo es `muralia2026`. Para empezar de cero, borra `backend/galeria.db`. Antes hay que hacer `aws configure` con una clave del proyecto (ver *Cómo correr Muralia en tu computador*).

Para usar otro bucket sin tocar el código: `MURALIA_S3_BUCKET=otro-bucket MURALIA_S3_REGION=us-east-1 python -m uvicorn app.main:app --reload`.

## Cómo preparar el bucket de imágenes en AWS

1. **Crear el bucket** `muralia-media-913051689392` en `us-east-1`. En **Bloquear acceso público**, desmarca solo las dos opciones de *políticas de bucket* (las de ACL pueden quedar marcadas).
2. **Permisos → Política del bucket**: pega [politica-bucket-imagenes.json](despliegue/politica-bucket-imagenes.json). Así cualquiera puede ver solo las imágenes aprobadas de `approved/`, todo el tráfico debe ser HTTPS y solo se pueden subir archivos de imagen (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).
3. **Permisos → Uso compartido de recursos entre orígenes (CORS)**: pega [cors-bucket-imagenes.json](despliegue/cors-bucket-imagenes.json). Sin esto, el navegador no deja subir a S3.
4. **IAM → Usuarios → Crear usuario** (por ejemplo `muralia-backend`) con una política en línea que tenga [politica-iam-backend.json](despliegue/politica-iam-backend.json). Luego, en **Credenciales de seguridad**, crea una clave de acceso tipo *Código local*.
5. En el computador del backend ejecuta `aws configure` y pega la clave, el secreto y la región `us-east-1`. Las credenciales quedan en `~/.aws/credentials` y **nunca se suben a GitHub**.

Si usas otro nombre de bucket, cámbialo en los tres archivos JSON y en la variable `MURALIA_S3_BUCKET`.

## Moderación automática de imágenes (Amazon Rekognition)

S3 no filtra contenido por sí solo, así que el bucket de imágenes usa una función Lambda que revisa cada foto antes de publicarla:

```
Navegador ──► uploads/<id>.jpg ──► Lambda muralia-moderacion ──► Rekognition DetectModerationLabels
                                         │
                                         ├── sin etiquetas  ──► approved/<id>.jpg  (pública, se muestra en la galería)
                                         └── con etiquetas  ──► rejected/<id>.jpg  (privada, se borra a los 7 días)
```

- Rekognition detecta desnudos, violencia, drogas, símbolos de odio y contenido perturbador con una confianza mínima del 60 % (variable `MIN_CONFIDENCE` de la Lambda).
- Al registrar la imagen, el backend espera hasta 20 segundos el veredicto. Si la imagen fue rechazada, responde con un error y no la guarda en la base de datos.
- Cada objeto queda etiquetado como `moderacion=approved` o `moderacion=rejected`.
- Seguridad del bucket: cifrado AES-256, versionado, solo HTTPS, solo formatos de imagen y lectura pública únicamente en `approved/`.

## Cómo ver el frontend en el computador

Abre la carpeta del proyecto en VS Code y abre cualquier `index.html` con **Live Server**. El backend debe estar encendido.

## Sitio publicado en Amazon S3

http://muralia-app-913051689392.s3-website-us-east-1.amazonaws.com

- Bucket: `muralia-app-913051689392`, región `us-east-1` (Norte de Virginia).
- Para que la página cargue datos, el backend tiene que estar encendido en el mismo computador donde se abre el enlace.
- La primera vez, el navegador puede bloquear la conexión con `localhost`. En Chrome o Brave, haz clic en el ícono de la barra de direcciones, permite el **acceso a la red local** y recarga la página.

## Cómo publicar el frontend en Amazon S3

1. En la consola de AWS entra a **S3** y crea un bucket, por ejemplo `muralia-app-913051689392`.
2. En **Bloquear acceso público**, desmarca la opción y confirma.
3. Sube el contenido de la carpeta del proyecto **menos la carpeta `backend`**: `index.html`, `api.js` y las carpetas `01-…` a `08-…`. Arrastra las carpetas completas para que se conserven las rutas.
4. En **Propiedades → Alojamiento de sitios web estáticos**, actívalo con documento de índice `index.html`.
5. En **Permisos → Política del bucket**, pega [politica-bucket.json](despliegue/politica-bucket.json). Si usas otro bucket, cambia `muralia-app-913051689392` por su nombre.
6. Abre el **punto de enlace del sitio web** que aparece en Propiedades (`http://…s3-website-…amazonaws.com`).

El backend ya acepta peticiones (CORS) de cualquier dirección `s3-website` de AWS y de `localhost`, así que no hay que cambiar nada para conectar el sitio de S3 con el backend local. El backend debe estar encendido en el mismo computador donde abres la página.

## Opcional, pendiente de aprobación: base de datos compartida (Amazon RDS)

Hoy cada computador tiene su propio `galeria.db`. Si se aprueba, los tres (y el profesor) pueden ver los mismos datos con una base en Amazon RDS. No está activada porque tiene costo (cerca de USD 3.6 al mes por la IP pública, más la instancia fuera del plan gratuito).

Para activarla: crearla una vez desde AWS CloudShell con [crear-rds.sh](despliegue/crear-rds.sh) (`bash despliegue/crear-rds.sh`), instalar `pip install "psycopg[binary]"` y encender el backend con `MURALIA_DB=rds`.

- Instancia `muralia-db`, PostgreSQL, `db.t4g.micro`, 20 GB cifrados, región `us-east-1`.
- Autenticación IAM: el usuario de base `muralia_app` no tiene contraseña. Entra quien tenga el permiso `rds-db:connect` (el usuario `muralia-backend` y el grupo `muralia-equipo`).
- La contraseña del administrador la guarda AWS Secrets Manager; nadie la escribe ni la comparte.
- Conexión obligatoria con SSL.
- Para no gastar cuando no se usa: `aws rds stop-db-instance --db-instance-identifier muralia-db` (AWS la vuelve a encender sola a los 7 días). Al terminar el semestre, eliminarla.

## Cómo correr Muralia en tu computador

1. Pide a quien administra la cuenta que te cree un usuario IAM en el grupo `muralia-equipo`.
2. En la consola de AWS: tu nombre → **Credenciales de seguridad** → **Crear clave de acceso** → **Código local**.
3. En tu computador:

```powershell
aws configure            # tu clave, tu clave secreta, región us-east-1, formato json
git clone https://github.com/Piwody/galeria-cloud-segura.git
cd galeria-cloud-segura
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
cd backend
python -m uvicorn app.main:app --reload
```

4. Abre http://muralia-app-913051689392.s3-website-us-east-1.amazonaws.com, permite el **acceso a la red local** y entra con `mateo.cantos@muralia.com` / `muralia2026`.

## Tecnologías

- **HTML5 y CSS3**: estructura y estilos, con Flexbox, Grid y media queries.
- **JavaScript**: `fetch()` para comunicarse con la API.
- **Python, FastAPI y Uvicorn**: la API.
- **SQLAlchemy y SQLite**: la base de datos local.
- **Amazon S3**: publicación del frontend y almacenamiento de las imágenes.
- **boto3**: conexión del backend con S3.
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
