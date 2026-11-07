# Muralia · Galería Cloud Segura

Proyecto Integrador 2026 · Programación Web · UIDE

## ¿Qué es el Proyecto Integrador?

Es el proyecto del semestre donde aplicamos lo aprendido en la materia de Programación Web. Partimos de los mockups que diseñamos en Figma y los convertimos en páginas web reales, para escritorio y para celular.

## ¿Qué es Muralia?

Muralia es una **galería de imágenes en la nube** donde cada persona puede subir, ver, guardar y descargar fotos de forma segura.

Cada imagen tiene su información (categoría, fecha de registro, formato, tamaño y responsable) y se guarda cifrada en la nube.

La aplicación tiene tres roles:

| Rol | Qué puede hacer |
|---|---|
| **Usuario** | Ver, descargar y guardar imágenes |
| **Editor** | Lo mismo que el usuario, y además editar la información de sus propias imágenes |
| **Administrador** | Todo lo anterior, eliminar cualquier imagen y gestionar las cuentas de usuarios (roles y estados) |

## Pantallas

Cada pantalla tiene su propia carpeta con su `index.html`, su `style.css` y su carpeta de imágenes (`img/` o `assets/`).

| Carpeta | Pantalla | Para qué sirve |
|---|---|---|
| `01-inicio-sesion` | Inicio de sesión | Entrar a la aplicación con correo y contraseña |
| `02-galeria-principal` | Galería principal | Ver todas las imágenes por categorías |
| `03-registro-imagen` | Registro de imagen | Subir una imagen nueva con su información |
| `04-detalle-imagen` | Detalle de imagen | Ver una imagen con sus datos, su responsable y las acciones disponibles |
| `05-gestion-usuarios` | Gestión de usuarios | Ver, buscar y administrar las cuentas de la plataforma |
| `06-mis-imagenes` | Mis imágenes | Ver las imágenes subidas por el usuario |
| `07-favoritos` | Favoritos | Ver las imágenes guardadas |
| `08-seguridad` | Seguridad | Ver los roles, sus permisos y la actividad reciente |

Las pantallas 01 a 05 siguen los mockups de Figma, con cambios acordados por el equipo en 04 y 05. Las pantallas 06, 07 y 08 no tienen mockup: se diseñaron con el mismo estilo.

Todas las pantallas funcionan en **escritorio** y en **celular**.

## Tecnologías

- **HTML5**: la estructura de cada página.
- **CSS3**: los estilos, con Flexbox, Grid y media queries:
  - `01` y `03`: `min-width: 768px` y `min-width: 1024px`.
  - `02`, `04`, `05`, `06`, `07` y `08`: `min-width: 769px` para escritorio y `max-width: 768px` para celular.
  - Interacción sin JavaScript: `:target` para las ventanas emergentes y `:checked` para los filtros.
- **Google Fonts**: Bodoni Moda para los títulos y Arimo para el texto.
- **Figma**: el diseño de los mockups y los íconos.
- **Git y GitHub**: para trabajar en equipo y guardar las versiones del proyecto.

Por ahora el proyecto es **solo frontend**: los enlaces conectan las 8 pantallas y las ventanas, filtros y pestañas funcionan con CSS, pero nada se guarda de verdad. Los datos son de ejemplo y AWS S3, el cifrado y la paginación solo se muestran como parte del diseño.

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

## Cómo verlo

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Piwody/galeria-cloud-segura.git
   ```
2. Abre la carpeta en VS Code.
3. Abre el `index.html` de cualquier pantalla con **Live Server**, o con doble clic.
4. Para ver la versión de celular, presiona **F12** y luego **Ctrl + Shift + M**.

## Equipo

- Mateo Cantos
- Gabriel Terán
- Pedro Carranza
