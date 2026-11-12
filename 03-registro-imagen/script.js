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
    llamarApi("GET", "/categorias", null, function (categorias) {
        llenarCategorias(categorias, seleccionada);
    }, mostrarMensaje);
}

function llenarFormulario(imagen) {
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
    mostrarArchivo(imagen.archivo, imagen.tamano_kb + " KB", API_URL + imagen.url, "Imagen guardada en el servidor");
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
        llamarApi("PUT", "/imagenes/" + idEditar, cambios, irAlDetalle, mostrarErrorAlGuardar);
        return;
    }

    if (!campoArchivo.files[0]) {
        mostrarMensaje("Elige una imagen antes de registrar.");
        return;
    }

    
    const datos = new FormData(formulario);
    datos.append("usuario_id", USUARIO_ACTUAL);
    document.getElementById("archivo-estado").textContent = "Subiendo imagen";
    botonRegistrar.disabled = true;
    mostrarMensaje("");
    llamarApi("POST", "/imagenes", datos, irAlDetalle, mostrarErrorAlGuardar);
});

document.getElementById("formulario-categoria").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const aviso = document.getElementById("mensaje-categoria");
    const nueva = {
        nombre: document.getElementById("nombre-categoria").value,
        descripcion: document.getElementById("descripcion-categoria").value,
    };

    llamarApi("POST", "/categorias", nueva, function (categoria) {
        cargarCategorias(categoria.id);
        document.getElementById("formulario-categoria").reset();
        aviso.textContent = "";
        location.hash = "";
        mostrarExito("Categoría «" + categoria.nombre + "» registrada.");
    }, function (texto) {
        aviso.textContent = texto;
    });
});

if (idEditar) {
    llamarApi("GET", "/imagenes/" + idEditar, null, llenarFormulario, mostrarMensaje);
} else {
    cargarCategorias(null);
}
