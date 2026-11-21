const formulario = document.getElementById("formulario");
const campoArchivo = document.getElementById("archivo");
const selectCategoria = document.getElementById("categoria");
const descripcion = document.getElementById("descripcion");
const contador = document.getElementById("contador");
const mensaje = document.getElementById("mensaje-form");
const botonRegistrar = document.getElementById("boton-registrar");
const archivoElegido = document.getElementById("archivo-elegido");

const idEditar = idDeLaDireccion();

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    mensaje.classList.remove("exito");
}

function mostrarExito(texto) {
    mensaje.textContent = texto;
    mensaje.classList.add("exito");
}

function mostrarArchivo(nombre, tamano, url, estado) {
    document.getElementById("archivo-vista").src = url;
    document.getElementById("archivo-nombre").textContent = nombre;
    document.getElementById("archivo-tamano").textContent = tamano;
    document.getElementById("archivo-estado").textContent = estado;
    document.getElementById("archivo-progreso").style.width = "100%";
    archivoElegido.hidden = false;
}

function llenarCategorias(categorias, seleccionada) {
    selectCategoria.textContent = "";

    const primera = document.createElement("option");
    primera.value = "";
    primera.textContent = "Elige una categoría";
    selectCategoria.appendChild(primera);

    for (let i = 0; i < categorias.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = categorias[i].id;
        opcion.textContent = categorias[i].nombre;
        selectCategoria.appendChild(opcion);
    }

    if (seleccionada) {
        selectCategoria.value = seleccionada;
    }
}

function cargarCategorias(seleccionada) {
    llamarApi(
        "GET",
        "/categorias",
        null,
        function (categorias) {
            llenarCategorias(categorias, seleccionada);
        },
        mostrarMensaje,
    );
}

function llenarFormulario(imagen) {
    if (imagen.usuario.id !== USUARIO_ACTUAL) {
        // Solo el autor puede editar: si no lo es, vuelve al detalle
        location.replace("../04-detalle-imagen/index.html?id=" + imagen.id);
        return;
    }
    document.title = "Editar imagen · Muralia";
    document.getElementById("titulo-pagina").textContent = "Editar imagen";
    document.getElementById("texto-boton").textContent = "Guardar cambios";
    document.getElementById("titulo").value = imagen.titulo;
    descripcion.value = imagen.descripcion;
    contador.textContent = descripcion.value.length + " / 500 caracteres";

    if (imagen.visibilidad === "Privada") {
        document.getElementById("privada").checked = true;
    }

    cargarCategorias(imagen.categoria.id);

    campoArchivo.disabled = true;
    document.querySelector(".zona-carga").hidden = true;
    document.getElementById("quitar-archivo").hidden = true;
    mostrarArchivo(imagen.archivo, imagen.tamano_kb + " KB", imagen.url, "Imagen guardada en el servidor");
}

function irAlDetalle(imagen) {
    location.href = "../04-detalle-imagen/index.html?id=" + imagen.id;
}

function mostrarErrorAlGuardar(texto) {
    mostrarMensaje(texto);
    botonRegistrar.disabled = false;
}

campoArchivo.addEventListener("change", function () {
    const archivo = campoArchivo.files[0];
    if (!archivo) {
        return;
    }
    let tamano = Math.round(archivo.size / 1024) + " KB";
    if (archivo.size > 1024 * 1024) {
        tamano = (archivo.size / 1024 / 1024).toFixed(1) + " MB";
    }
    mostrarArchivo(archivo.name, tamano, URL.createObjectURL(archivo), "Lista para subir");
});

document.getElementById("quitar-archivo").addEventListener("click", function () {
    campoArchivo.value = "";
    archivoElegido.hidden = true;
});

descripcion.addEventListener("input", function () {
    contador.textContent = descripcion.value.length + " / 500 caracteres";
});

formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (idEditar) {
        const cambios = {
            titulo: document.getElementById("titulo").value,
            descripcion: descripcion.value,
            visibilidad: formulario.visibilidad.value,
            categoria_id: Number(selectCategoria.value),
        };
        botonRegistrar.disabled = true;
        llamarApi("PUT", "/imagenes/" + idEditar + "?usuario_id=" + USUARIO_ACTUAL, cambios, irAlDetalle, mostrarErrorAlGuardar);
        return;
    }

    const archivo = campoArchivo.files[0];
    if (!archivo) {
        mostrarMensaje("Elige una imagen antes de registrar.");
        return;
    }

    if (USUARIO_ACTUAL === null) {
        mostrarMensaje("Inicia sesión para registrar imágenes.");
        return;
    }

    botonRegistrar.disabled = true;
    mostrarMensaje("");
    subirImagen(archivo);
});

function subirImagen(archivo) {
    estadoArchivo("Preparando la subida a AWS S3", "20%");
    const solicitud = { tipo: archivo.type, tamano: archivo.size, categoria_id: Number(selectCategoria.value) };
    llamarApi(
        "POST",
        "/imagenes/subida",
        solicitud,
        function (firma) {
            enviarAS3(archivo, firma);
        },
        mostrarErrorAlGuardar,
    );
}

function enviarAS3(archivo, firma) {
    estadoArchivo("Subiendo imagen a AWS S3", "50%");
    const datos = new FormData();
    for (const campo in firma.campos) {
        datos.append(campo, firma.campos[campo]);
    }
    datos.append("file", archivo);

    fetch(firma.url_subida, { method: "POST", body: datos })
        .then(function (respuesta) {
            if (!respuesta.ok) {
                mostrarErrorAlGuardar("AWS S3 rechazó la imagen (código " + respuesta.status + ").");
                return;
            }
            guardarEnBaseDeDatos(archivo, firma.url_imagen);
        })
        .catch(function () {
            mostrarErrorAlGuardar("No se pudo conectar con AWS S3. Revisa el CORS del bucket.");
        });
}

function guardarEnBaseDeDatos(archivo, urlImagen) {
    estadoArchivo("Guardando en la base de datos", "85%");
    const imagen = {
        titulo: document.getElementById("titulo").value,
        descripcion: descripcion.value,
        visibilidad: formulario.visibilidad.value,
        categoria_id: Number(selectCategoria.value),
        usuario_id: USUARIO_ACTUAL,
        url: urlImagen,
        nombre_archivo: archivo.name,
    };
    llamarApi("POST", "/imagenes", imagen, irAlDetalle, mostrarErrorAlGuardar);
}

function estadoArchivo(texto, avance) {
    document.getElementById("archivo-estado").textContent = texto;
    document.getElementById("archivo-progreso").style.width = avance;
}

document.getElementById("formulario-categoria").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const aviso = document.getElementById("mensaje-categoria");
    const nueva = {
        nombre: document.getElementById("nombre-categoria").value,
        descripcion: document.getElementById("descripcion-categoria").value,
    };

    llamarApi(
        "POST",
        "/categorias",
        nueva,
        function (categoria) {
            cargarCategorias(categoria.id);
            document.getElementById("formulario-categoria").reset();
            aviso.textContent = "";
            location.hash = "";
            mostrarExito("Categoría «" + categoria.nombre + "» registrada.");
        },
        function (texto) {
            aviso.textContent = texto;
        },
    );
});

if (idEditar) {
    llamarApi("GET", "/imagenes/" + idEditar, null, llenarFormulario, mostrarMensaje);
} else {
    cargarCategorias(null);
}
