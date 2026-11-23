# Guía para el equipo · Cómo correr Muralia en tu computador

Esta guía es para que cualquiera del grupo pueda encender Muralia en su computador, ver la galería funcionando, modificar el código y ver los cambios en vivo.

## Cómo está armado

```
Tu navegador
   │
   ├── Páginas (HTML, CSS, JS) ──► desde S3 (enlace público) o desde Live Server (para editar)
   │
   └── Datos ──► API local FastAPI en TU computador (http://localhost:8000)
                    │
                    ├── backend/galeria.db  (SQLite: usuarios, categorías, me gusta, guardados)
                    └── Amazon S3            (los archivos de las fotos, con TU clave de AWS)
```

- La página siempre busca la API en `localhost:8000`, o sea, en **tu propio** computador. Por eso cada uno tiene que encender su backend.
- Cada computador tiene su propio `galeria.db`. Las 12 imágenes de ejemplo salen igual para todos, pero lo que subas o el me gusta que des solo lo vas a ver tú.

---

## 1. Instalar lo necesario (solo la primera vez)

En **PowerShell** (Windows):

```powershell
winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements
winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
winget install -e --id Amazon.AWSCLI --accept-package-agreements --accept-source-agreements
winget install -e --id Microsoft.VisualStudioCode --accept-package-agreements --accept-source-agreements
```

Cierra PowerShell y ábrelo de nuevo para que reconozca los programas. Luego instala la extensión **Live Server** de VS Code:

```powershell
code --install-extension ritwickdey.LiveServer
```

Si algún `winget` dice que el programa ya está instalado, no pasa nada: sigue con el siguiente.

## 2. Crear tu clave de acceso de AWS (solo la primera vez)

1. Entra a https://913051689392.signin.aws.amazon.com/console con tu usuario (`Mateo` o `Joaquin`) y tu contraseña.
2. Arriba a la derecha, clic en tu nombre → **Credenciales de seguridad**.
3. En **Claves de acceso** → **Crear clave de acceso** → elige **Código local** → marca la casilla de confirmación → **Siguiente** → **Crear clave de acceso**.
4. Copia la **Clave de acceso** y la **Clave de acceso secreta**, o descarga el `.csv`. La secreta **solo se muestra una vez**.

> Esa clave es tuya. No la compartas ni la subas a GitHub.

## 3. Configurar la clave en tu computador (solo la primera vez)

```powershell
aws configure
aws sts get-caller-identity
```

En `aws configure` llenas:

| Pregunta | Qué poner |
|---|---|
| AWS Access Key ID | Tu clave de acceso |
| AWS Secret Access Key | Tu clave secreta |
| Default region name | `us-east-1` |
| Default output format | `json` |

Si `get-caller-identity` muestra `...:user/Mateo` o `...:user/Joaquin`, quedó bien. El backend usa esta clave solo, no tienes que ponerla en el código.

## 4. Bajar el proyecto y preparar el backend (solo la primera vez)

```powershell
cd $HOME\Documents
git clone https://github.com/Piwody/galeria-cloud-segura.git
cd galeria-cloud-segura
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Si `Activate.ps1` da error de "ejecución de scripts deshabilitada", corre esto una vez, responde `S` y repite el `Activate.ps1`:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 5. Encender el backend (cada vez que vayas a usar la app)

```powershell
cd $HOME\Documents\galeria-cloud-segura
git pull
.\.venv\Scripts\Activate.ps1
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Cuando salga `Application startup complete`, está listo. **No cierres esa ventana** mientras uses la app.

La primera vez se crea tu `galeria.db` con 7 categorías, 6 usuarios y 12 imágenes de ejemplo.

## 6. Abrir la app

Tienes dos formas. Las dos usan tu backend.

| Para… | Abre | Notas |
|---|---|---|
| Ver la versión publicada (la del video) | http://muralia-app-913051689392.s3-website-us-east-1.amazonaws.com | La primera vez, en el ícono de la barra de direcciones permite el **acceso a la red local** y recarga. |
| Editar el código y ver los cambios en vivo | VS Code → abre la carpeta `galeria-cloud-segura` → clic derecho en `index.html` → **Open with Live Server** | Se abre en `http://127.0.0.1:5500`. |

### Usuarios de ejemplo

Contraseña de todos: `muralia2026`. Puedes entrar con el correo o con el usuario (lo que va antes de la @).

| Correo | Rol | ¿Puede entrar? |
|---|---|---|
| mateo.cantos@muralia.com | Administrador | Sí |
| pedro.carranza@muralia.com | Administrador | Sí |
| gabriel.teran@muralia.com | Editor | Sí |
| laura.andrade@muralia.com | Usuario | Sí |
| sofia.ruiz@muralia.com | Editor | No (inactiva) |
| andres.vega@muralia.com | Usuario | No (suspendido) |

Los administradores ven además **Usuarios** y **Seguridad** en el menú.

## 7. Modificar y ver los cambios en vivo

| Qué cambias | Dónde | Cómo se ve el cambio |
|---|---|---|
| Diseño, textos, pantallas | Carpetas `01-…` a `09-…`, `api.js`, `comun.css`, `coleccion.js` | Guarda el archivo (Ctrl + S) y **Live Server recarga la página solo**. |
| Lógica de la API, reglas, base de datos | `backend/app/…` | Guarda el archivo y **uvicorn se reinicia solo** (por el `--reload`). Mira la terminal por si sale un error. |
| Probar un endpoint sin la página | http://localhost:8000/docs | Elige el endpoint → **Try it out** → **Execute**. |

Archivos clave del backend:

| Archivo | Qué tiene |
|---|---|
| `app/routers/` | Las rutas de la API (qué URL hace qué) |
| `app/services/` | Las reglas: validaciones, permisos, guardar en la base |
| `app/models.py` | Las tablas de la base de datos |
| `app/schemas.py` | Qué datos entran y salen de cada ruta |
| `app/s3.py` | Todo lo que habla con Amazon S3 |
| `app/config.py` | Nombre del bucket, región, orígenes permitidos (CORS) |

> Si cambias `models.py` (agregas una columna o una tabla), apaga el backend, borra `backend\galeria.db` y vuelve a encenderlo para que se cree con la estructura nueva.

## 8. Subir tus cambios a GitHub

Antes de empezar a trabajar, siempre `git pull` para tener lo último del grupo. Cuando termines:

```powershell
cd $HOME\Documents\galeria-cloud-segura
git pull
git add -A
git status
git commit -m "Describe en pocas palabras lo que cambiaste"
git push origin main
```

- En `git status` **no** debe aparecer `backend/galeria.db` (está en el `.gitignore`).
- Avisen en el grupo antes de cambiar el mismo archivo que otro, para no pisarse.

## 9. Publicar los cambios en el sitio de S3

Solo cuando los cambios ya estén probados **y subidos a GitHub**. Desde la carpeta del proyecto:

```powershell
cd $HOME\Documents\galeria-cloud-segura
aws s3 sync . s3://muralia-app-913051689392 --delete --exclude ".git/*" --exclude ".gitignore" --exclude ".vscode/*" --exclude ".venv/*" --exclude "backend/*" --exclude "despliegue/*" --exclude "*.md"
```

Después abre el enlace de S3 y recarga con **Ctrl + F5**. Como el bucket tiene control de versiones, si algo sale mal se puede volver a la versión anterior de cualquier archivo.

## 10. Empezar de cero con los datos

Si tu galería quedó rara o quieres volver a los datos de ejemplo:

```powershell
cd $HOME\Documents\galeria-cloud-segura\backend
Remove-Item .\galeria.db -ErrorAction SilentlyContinue
..\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

---

## Problemas comunes

| Qué ves | Qué pasa | Solución |
|---|---|---|
| `aws` / `git` / `python` no se reconoce | La ventana se abrió antes de instalar | Cierra y abre PowerShell de nuevo |
| "No se pudo conectar con el servidor" | El backend está apagado o el navegador lo bloquea | Enciende el backend (paso 5) y permite el **acceso a la red local** en la barra de direcciones |
| "El backend no pudo conectarse con AWS S3" | Falta tu clave o está mal | Repite `aws configure` y revisa con `aws sts get-caller-identity` |
| La galería sale vacía | La primera vez el backend arrancó sin clave y no pudo subir los ejemplos | Configura la clave y haz el paso 10 |
| La página se recarga sola a cada rato | Live Server está vigilando la base de datos | Usa la carpeta completa del repo (trae `.vscode/settings.json`) y reinicia Live Server |
| `[Errno 10048]` o puerto 8000 en uso | Ya hay un backend encendido | Cierra la otra ventana del backend o reinicia el computador |
| No puedo iniciar sesión con Sofía o Andrés | Están inactiva y suspendido a propósito | Usa otro usuario de la tabla |

## En Linux

Los pasos son los mismos. Solo cambian la instalación y la activación del entorno:

```bash
curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip && unzip -q awscliv2.zip && sudo ./aws/install
aws configure
git clone https://github.com/Piwody/galeria-cloud-segura.git && cd galeria-cloud-segura
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend && python -m uvicorn app.main:app --reload
```
