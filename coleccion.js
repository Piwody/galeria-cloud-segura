// Mis imágenes (06), Favoritos (07, las que le dio me gusta) y Guardados (09):
// muestran solo lo del usuario que inició sesión
const esFavoritos = location.pathname.includes("07-favoritos");
const esGuardados = location.pathname.includes("09-guardados");
const galeriaColeccion = document.getElementById("galeria");
const contadorColeccion = document.getElementById("contador");
const mensajeColeccion = document.getElementById("mensaje");
const alturasColeccion = ["media", "alta", "baja", "media"];

function elemento(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
}

function icono(src, alt, tamano) {
    const imagen = document.createElement("img");
    imagen.src = src;
    imagen.alt = alt;
    imagen.width = tamano;
    imagen.height = tamano;
    return imagen;
}

function tarjetaColeccion(imagen, posicion) {
    const tarjeta = elemento("a", "tarjeta");
    tarjeta.dataset.id = imagen.id;
    tarjeta.href = "../04-detalle-imagen/index.html?id=" + imagen.id;

    const marco = elemento("div", "tarjeta-imagen " + alturasColeccion[posicion % 4]);
    marco.appendChild(icono(imagen.url, imagen.titulo));
    marco.firstChild.removeAttribute("width");
    marco.firstChild.removeAttribute("height");

    const info = elemento("div", "tarjeta-info");
    const fila1 = elemento("div", "tarjeta-fila");
    const categoria = elemento("span", "insignia insignia-crema");
    categoria.append(icono("img/punto-oscuro.svg", "", 6), imagen.categoria.nombre);
    const visibilidad = icono(imagen.visibilidad === "Privada" ? "img/candado.svg" : "img/mundo.svg", imagen.visibilidad, 16);
    visibilidad.title = imagen.visibilidad;
    fila1.append(categoria, visibilidad);

    const fila2 = elemento("div", "tarjeta-fila");
    const autor = elemento("span", "autor");
    autor.append(elemento("span", "avatar " + colorAvatar(imagen.usuario.id), iniciales(imagen.usuario.nombre)),
                 elemento("span", "", imagen.usuario.nombre));
    fila2.append(autor, crearBotonMeGusta(imagen));

    info.append(elemento("h2", "tarjeta-titulo", imagen.titulo), fila1, fila2);
    tarjeta.append(marco, info);
    return tarjeta;
}

let coleccion = [];

function mostrarColeccion(imagenes) {
    coleccion = imagenes;
    galeriaColeccion.textContent = "";
    imagenes.forEach(function (imagen, posicion) {
        galeriaColeccion.appendChild(tarjetaColeccion(imagen, posicion));
    });
    contadorColeccion.textContent = imagenes.length + (imagenes.length === 1 ? " imagen" : " imágenes");
    if (imagenes.length === 0) {
        if (esFavoritos) {
            mensajeColeccion.textContent = "Aún no le diste me gusta a ninguna imagen. Toca el corazón ♡ en la galería.";
        } else if (esGuardados) {
            mensajeColeccion.textContent = "Aún no tienes imágenes guardadas. Abre una imagen y presiona «Guardar».";
        } else {
            mensajeColeccion.textContent = "Todavía no has subido imágenes. Usa el botón «Subir imagen».";
        }
    } else {
        mensajeColeccion.textContent = "";
    }
}

function errorColeccion(texto) {
    contadorColeccion.textContent = "";
    mensajeColeccion.textContent = texto;
}

if (USUARIO_ACTUAL !== null) {
    let ruta = "/imagenes?usuario_id=" + USUARIO_ACTUAL + "&visitante_id=" + USUARIO_ACTUAL;
    if (esFavoritos) {
        ruta = "/imagenes/me-gusta?usuario_id=" + USUARIO_ACTUAL;
    } else if (esGuardados) {
        ruta = "/imagenes/guardadas?usuario_id=" + USUARIO_ACTUAL;
    }
    llamarApi("GET", ruta, null, mostrarColeccion, errorColeccion);
}

// En Favoritos, si quitas el me gusta la imagen sale de la lista
document.addEventListener("muralia:me-gusta", function (evento) {
    if (esFavoritos && !evento.detail.le_gusta) {
        mostrarColeccion(coleccion.filter(function (imagen) { return imagen.id !== evento.detail.id; }));
    }
});
