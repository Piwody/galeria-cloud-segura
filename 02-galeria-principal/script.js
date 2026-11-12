const galeria = document.getElementById("galeria");
const chips = document.getElementById("chips");
const contador = document.getElementById("contador");
const mensaje = document.getElementById("mensaje");
const plantilla = document.getElementById("plantilla-tarjeta");
const buscarEscritorio = document.getElementById("buscar-escritorio");
const buscarMovil = document.getElementById("buscar-movil");

const alturas = ["alta", "media", "baja", "media"];
let imagenes = [];

function crearTarjeta(imagen, posicion) {
    const tarjeta = plantilla.content.cloneNode(true);

    tarjeta.querySelector(".tarjeta").href = "../04-detalle-imagen/index.html?id=" + imagen.id;
    tarjeta.querySelector(".tarjeta-imagen").classList.add(alturas[posicion % 4]);
    tarjeta.querySelector(".tarjeta-imagen img").src = API_URL + imagen.url;
    tarjeta.querySelector(".tarjeta-imagen img").alt = imagen.titulo;
    tarjeta.querySelector(".tarjeta-titulo").textContent = imagen.titulo;
    tarjeta.querySelector(".categoria").textContent = imagen.categoria.nombre;

    const icono = tarjeta.querySelector(".visibilidad");
    icono.alt = imagen.visibilidad;
    if (imagen.visibilidad === "Privada") {
        icono.src = "img/candado.svg";
    } else {
        icono.src = "img/mundo.svg";
    }

    const avatar = tarjeta.querySelector(".avatar");
    avatar.textContent = iniciales(imagen.usuario.nombre);
    avatar.classList.add(colorAvatar(imagen.usuario.id));
    tarjeta.querySelector(".nombre").textContent = imagen.usuario.nombre;
    tarjeta.querySelector(".me-gusta").textContent = fechaCorta(imagen.fecha_registro);

    return tarjeta;
}

function mostrarImagenes() {
    const texto = (buscarEscritorio.value + buscarMovil.value).toLowerCase();
    galeria.textContent = "";
    let cantidad = 0;

    for (let i = 0; i < imagenes.length; i++) {
        const imagen = imagenes[i];
        const datos = (imagen.titulo + " " + imagen.usuario.nombre + " " + imagen.categoria.nombre).toLowerCase();
        if (datos.includes(texto)) {
            galeria.appendChild(crearTarjeta(imagen, cantidad));
            cantidad = cantidad + 1;
        }
    }

    contador.textContent = cantidad + " imágenes";
    if (cantidad === 0) {
        mensaje.textContent = "No hay imágenes para mostrar.";
    } else {
        mensaje.textContent = "";
    }
}

function guardarImagenes(lista) {
    imagenes = lista;
    mostrarImagenes();
}

function mostrarError(texto) {
    galeria.textContent = "";
    mensaje.textContent = texto;
}

function cargarImagenes(categoriaId) {
    mensaje.textContent = "Cargando imágenes…";
    let ruta = "/imagenes";
    if (categoriaId) {
        ruta = "/imagenes?categoria_id=" + categoriaId;
    }
    llamarApi("GET", ruta, null, guardarImagenes, mostrarError);
}

function crearChip(texto, categoriaId) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = texto;

    chip.addEventListener("click", function () {
        const todos = chips.querySelectorAll(".chip");
        for (let i = 0; i < todos.length; i++) {
            todos[i].classList.remove("activa");
        }
        chip.classList.add("activa");
        cargarImagenes(categoriaId);
    });

    chips.appendChild(chip);
    return chip;
}

function mostrarCategorias(categorias) {
    crearChip("Todas", null).classList.add("activa");
    for (let i = 0; i < categorias.length; i++) {
        crearChip(categorias[i].nombre, categorias[i].id);
    }
}

buscarEscritorio.addEventListener("input", mostrarImagenes);
buscarMovil.addEventListener("input", mostrarImagenes);

llamarApi("GET", "/categorias", null, mostrarCategorias, function () {});
cargarImagenes(null);
