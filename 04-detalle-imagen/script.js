let imagenActual = null;

function poner(id, texto) {
    document.getElementById(id).textContent = texto;
}

function mostrarImagen(imagen) {
    imagenActual = imagen;
    const fecha = fechaCorta(imagen.fecha_registro);
    const url = imagen.url;
    document.title = imagen.titulo + " · Muralia";

    document.getElementById("imagen").src = url;
    document.getElementById("imagen").alt = imagen.titulo;

    poner("insignia-categoria", imagen.categoria.nombre);
    poner("insignia-visibilidad", imagen.visibilidad);
    poner("titulo", imagen.titulo);
    poner("descripcion", imagen.descripcion);

    poner("dato-categoria", imagen.categoria.nombre);
    poner("dato-fecha", fecha + " · " + hora(imagen.fecha_registro));
    poner("dato-formato", imagen.formato);
    poner("dato-tamano", imagen.tamano_kb + " KB");

    const avatar = document.getElementById("responsable-avatar");
    avatar.textContent = iniciales(imagen.usuario.nombre);
    avatar.className = "avatar " + colorAvatar(imagen.usuario.id);
    poner("responsable-nombre", imagen.usuario.nombre);
    poner("responsable-correo", imagen.usuario.correo);
    poner("responsable-fecha", "Responsable · " + fecha);
    poner("responsable-rol", imagen.usuario.rol);

    poner("movil-formato", imagen.formato);
    poner("movil-tamano", imagen.tamano_kb + " KB");
    poner("movil-visibilidad", imagen.visibilidad);

    const descargas = document.querySelectorAll(".descargar");
    for (let i = 0; i < descargas.length; i++) {
        descargas[i].href = url;
    }

    const ediciones = document.querySelectorAll(".editar");
    for (let i = 0; i < ediciones.length; i++) {
        ediciones[i].href = "../03-registro-imagen/index.html?id=" + imagen.id;
    }

    document.getElementById("enlace-compartir").value = location.href;

    llamarApi("GET", "/imagenes?usuario_id=" + imagen.usuario.id, null, mostrarMasDelAutor, function () {});
}

function mostrarMasDelAutor(imagenes) {
    const contenedor = document.getElementById("mas-del-autor");
    const plantilla = document.getElementById("plantilla-miniatura");
    let cantidad = 0;

    for (let i = 0; i < imagenes.length && cantidad < 4; i++) {
        if (imagenes[i].id !== imagenActual.id) {
            const miniatura = plantilla.content.cloneNode(true);
            miniatura.querySelector("a").href = "index.html?id=" + imagenes[i].id;
            miniatura.querySelector("a").title = imagenes[i].titulo;
            miniatura.querySelector("img").src = imagenes[i].url;
            miniatura.querySelector("img").alt = imagenes[i].titulo;
            contenedor.appendChild(miniatura);
            cantidad = cantidad + 1;
        }
    }

    if (cantidad > 0) {
        poner("mas-del-autor-titulo", "Más de " + imagenActual.usuario.nombre);
    }
}

function mostrarError(texto) {
    poner("titulo", "No se pudo cargar la imagen");
    poner("descripcion", texto);
}

function mostrarPrimera(imagenes) {
    if (imagenes.length === 0) {
        poner("titulo", "Todavía no hay imágenes");
    } else {
        mostrarImagen(imagenes[0]);
    }
}

document.getElementById("confirmar-eliminar").addEventListener("click", function () {
    llamarApi("DELETE", "/imagenes/" + imagenActual.id, null, function () {
        location.href = "../02-galeria-principal/index.html";
    }, function (texto) {
        poner("mensaje-eliminar", texto);
    });
});

const id = idDeLaDireccion();
if (id) {
    llamarApi("GET", "/imagenes/" + id, null, mostrarImagen, mostrarError);
} else {
    llamarApi("GET", "/imagenes", null, mostrarPrimera, mostrarError);
}
