let imagenActual = null;

function poner(id, texto) {
    document.getElementById(id).textContent = texto;
}

function esAutor(imagen) {
    return USUARIO_ACTUAL !== null && imagen.usuario.id === USUARIO_ACTUAL;
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
    poner("dato-vistas", formatoNumero(imagen.vistas));

    poner("dato-categoria", imagen.categoria.nombre);
    poner("dato-fecha", fecha + " · " + hora(imagen.fecha_registro));
    poner("dato-formato", imagen.formato);
    poner("dato-tamano", imagen.tamano_kb + " KB");

    const avatar = document.getElementById("responsable-avatar");
    avatar.textContent = iniciales(imagen.usuario.nombre);
    avatar.className = "avatar " + colorAvatar(imagen.usuario.id);
    poner("responsable-nombre", imagen.usuario.nombre);
    poner("responsable-correo", imagen.usuario.correo);
    poner("responsable-fecha", "Autor · " + fecha);
    poner("responsable-rol", imagen.usuario.rol);

    poner("movil-formato", imagen.formato);
    poner("movil-tamano", imagen.tamano_kb + " KB");
    poner("movil-visibilidad", imagen.visibilidad);

    // Me gusta: en escritorio junto a las vistas y en el celular sobre la imagen
    const zonaMeGusta = document.getElementById("estadistica-me-gusta");
    zonaMeGusta.textContent = "";
    zonaMeGusta.appendChild(crearBotonMeGusta(imagen, { texto: true }));
    const flotantes = document.querySelector(".acciones-flotantes-derecha");
    if (flotantes && !flotantes.querySelector(".boton-me-gusta")) {
        flotantes.prepend(crearBotonMeGusta(imagen, { clase: "boton-icono", soloIcono: true }));
    }

    // Editar y eliminar solo los ve quien subió la imagen
    document.body.classList.toggle("es-autor", esAutor(imagen));
    const ediciones = document.querySelectorAll(".editar");
    for (let i = 0; i < ediciones.length; i++) {
        ediciones[i].href = "../03-registro-imagen/index.html?id=" + imagen.id;
    }

    pintarGuardada();
    document.getElementById("enlace-compartir").value =
        location.origin + location.pathname + "?id=" + imagen.id;

    llamarApi("GET", "/imagenes?usuario_id=" + imagen.usuario.id, null, mostrarMasDelAutor, function () {});
}

// ---------- Guardar ----------
function pintarGuardada() {
    const guardada = Boolean(imagenActual.guardada);
    document.querySelectorAll(".guardar").forEach(function (boton) {
        boton.classList.toggle("boton-guardada", guardada);
        boton.title = guardada ? "Quitar de guardadas" : "Guardar";
        boton.setAttribute("aria-pressed", guardada ? "true" : "false");
        const texto = boton.querySelector(".guardar-texto");
        if (texto) {
            texto.textContent = guardada ? "Guardada" : "Guardar";
        }
    });
}

document.querySelectorAll(".guardar").forEach(function (boton) {
    boton.addEventListener("click", function () {
        if (!imagenActual || USUARIO_ACTUAL === null) {
            return;
        }
        const antes = imagenActual.guardada;
        imagenActual.guardada = !antes;
        pintarGuardada();
        llamarApi("POST", "/imagenes/" + imagenActual.id + "/guardar", { usuario_id: USUARIO_ACTUAL },
            function (respuesta) {
                imagenActual.guardada = respuesta.guardada;
                pintarGuardada();
            },
            function () {
                imagenActual.guardada = antes;
                pintarGuardada();
            });
    });
});

// ---------- Descargar directo, sin salir de la página ----------
function nombreDeDescarga(imagen) {
    const extension = "." + imagen.formato.toLowerCase();
    let nombre = imagen.archivo || imagen.titulo;
    if (!nombre.toLowerCase().endsWith(extension)) {
        nombre = nombre + extension;
    }
    return nombre;
}

document.querySelectorAll(".descargar").forEach(function (boton) {
    boton.addEventListener("click", function (evento) {
        evento.preventDefault();
        if (!imagenActual) {
            return;
        }
        boton.style.pointerEvents = "none";
        fetch(imagenActual.url, { mode: "cors", cache: "no-store" })
            .then(function (respuesta) {
                if (!respuesta.ok) {
                    throw new Error("HTTP " + respuesta.status);
                }
                return respuesta.blob();
            })
            .then(function (archivo) {
                const enlace = document.createElement("a");
                enlace.href = URL.createObjectURL(archivo);
                enlace.download = nombreDeDescarga(imagenActual);
                document.body.appendChild(enlace);
                enlace.click();
                enlace.remove();
                setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 2000);
            })
            .catch(function () {
                alert("No se pudo descargar la imagen. Revisa tu conexión e inténtalo de nuevo.");
            })
            .finally(function () {
                boton.style.pointerEvents = "";
            });
    });
});

// ---------- Compartir: copiar enlace ----------
const botonCopiar = document.getElementById("copiar-enlace");
botonCopiar.addEventListener("click", function () {
    const campo = document.getElementById("enlace-compartir");
    function avisarCopiado() {
        botonCopiar.textContent = "¡Enlace copiado!";
        setTimeout(function () { botonCopiar.textContent = "Copiar"; }, 2000);
    }
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(campo.value).then(avisarCopiado);
    } else {
        campo.select();
        document.execCommand("copy");
        avisarCopiado();
    }
});

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
        location.replace("index.html?id=" + imagenes[0].id);
    }
}

document.getElementById("confirmar-eliminar").addEventListener("click", function () {
    llamarApi("DELETE", "/imagenes/" + imagenActual.id + "?usuario_id=" + USUARIO_ACTUAL, null, function () {
        location.href = "../06-mis-imagenes/index.html";
    }, function (texto) {
        poner("mensaje-eliminar", texto);
    });
});

// Cuenta una sola vista por imagen en cada sesión del navegador (recargar no suma vistas)
function debeContarVista(imagenId) {
    try {
        const vistas = JSON.parse(sessionStorage.getItem("muralia_vistas") || "[]");
        if (vistas.includes(imagenId)) {
            return false;
        }
        vistas.push(imagenId);
        sessionStorage.setItem("muralia_vistas", JSON.stringify(vistas));
        return true;
    } catch (error) {
        return false;
    }
}

const id = idDeLaDireccion();
if (id) {
    llamarApi("GET", "/imagenes/" + id + "?contar_vista=" + debeContarVista(id) + "&visitante_id=" + USUARIO_ACTUAL,
        null, mostrarImagen, mostrarError);
} else {
    llamarApi("GET", "/imagenes", null, mostrarPrimera, mostrarError);
}
