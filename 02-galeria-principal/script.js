const galeria = document.getElementById("galeria");
const chips = document.getElementById("chips");
const contador = document.getElementById("contador");
const mensaje = document.getElementById("mensaje");
const plantilla = document.getElementById("plantilla-tarjeta");
const buscarEscritorio = document.getElementById("buscar-escritorio");
const buscarMovil = document.getElementById("buscar-movil");

const alturas = ["alta", "media", "baja"];
// Columnas según el ancho de pantalla (igual que los cortes del CSS)
function numeroDeColumnas() {
    if (window.matchMedia("(max-width: 768px)").matches) return 2;
    if (window.matchMedia("(max-width: 1100px)").matches) return 3;
    return 4;
}
let imagenes = [];
let categoriaActiva = null;

// Filtros y orden (inspirado en Unsplash / Pinterest: panel desplegable + orden aparte)
const FILTROS_VACIOS = { visibilidad: "Todas", formato: "Todos", autor: "", meGusta: false, guardadas: false };
let filtros = Object.assign({}, FILTROS_VACIOS);
const ORDENES = [
    { clave: "recientes", texto: "Más recientes" },
    { clave: "antiguas", texto: "Más antiguas" },
    { clave: "gustadas", texto: "Más me gusta" },
    { clave: "vistas", texto: "Más vistas" },
    { clave: "titulo", texto: "Título (A–Z)" },
];
let orden = "recientes";

function crearTarjeta(imagen, altura) {
    const tarjeta = plantilla.content.cloneNode(true);

    tarjeta.querySelector(".tarjeta").href = "../04-detalle-imagen/index.html?id=" + imagen.id;
    tarjeta.querySelector(".tarjeta-imagen").classList.add(altura);
    tarjeta.querySelector(".tarjeta-imagen img").src = imagen.url;
    tarjeta.querySelector(".tarjeta-imagen img").alt = imagen.titulo;
    tarjeta.querySelector(".tarjeta-titulo").textContent = imagen.titulo;
    tarjeta.querySelector(".categoria").textContent = imagen.categoria.nombre;

    const icono = tarjeta.querySelector(".visibilidad");
    icono.alt = imagen.visibilidad;
    icono.title = imagen.visibilidad;
    if (imagen.visibilidad === "Privada") {
        icono.src = "img/candado.svg";
    } else {
        icono.src = "img/mundo.svg";
    }

    const avatar = tarjeta.querySelector(".avatar");
    avatar.textContent = iniciales(imagen.usuario.nombre);
    avatar.classList.add(colorAvatar(imagen.usuario.id));
    tarjeta.querySelector(".nombre").textContent = imagen.usuario.nombre;
    tarjeta.querySelector(".me-gusta").replaceWith(crearBotonMeGusta(imagen));

    return tarjeta;
}

function cantidadDeFiltros() {
    let cantidad = 0;
    if (filtros.visibilidad !== "Todas") cantidad++;
    if (filtros.formato !== "Todos") cantidad++;
    if (filtros.autor !== "") cantidad++;
    if (filtros.meGusta) cantidad++;
    if (filtros.guardadas) cantidad++;
    return cantidad;
}

function pasaLosFiltros(imagen, texto) {
    const datos = (imagen.titulo + " " + imagen.usuario.nombre + " " + imagen.categoria.nombre).toLowerCase();
    if (!datos.includes(texto)) return false;
    if (filtros.visibilidad !== "Todas" && imagen.visibilidad !== filtros.visibilidad) return false;
    if (filtros.formato !== "Todos" && imagen.formato !== filtros.formato) return false;
    if (filtros.autor !== "" && String(imagen.usuario.id) !== filtros.autor) return false;
    if (filtros.meGusta && !imagen.le_gusta) return false;
    if (filtros.guardadas && !imagen.guardada) return false;
    return true;
}

function ordenar(lista) {
    const copia = lista.slice();
    copia.sort(function (a, b) {
        if (orden === "antiguas") return a.fecha_registro.localeCompare(b.fecha_registro);
        if (orden === "gustadas") return b.me_gusta - a.me_gusta;
        if (orden === "vistas") return b.vistas - a.vistas;
        if (orden === "titulo") return a.titulo.localeCompare(b.titulo, "es");
        return b.fecha_registro.localeCompare(a.fecha_registro);
    });
    return copia;
}

function mostrarImagenes() {
    const texto = (buscarEscritorio.value + buscarMovil.value).toLowerCase().trim();
    const visibles = ordenar(imagenes.filter(function (imagen) { return pasaLosFiltros(imagen, texto); }));
    galeria.textContent = "";
    // Reparte de izquierda a derecha: la 1.ª imagen en la columna 1, la 2.ª en la 2… y vuelve a empezar.
    // La altura cambia en diagonal para que se vea como mosaico sin dejar columnas vacías.
    const total = numeroDeColumnas();
    const columnas = [];
    for (let c = 0; c < total; c++) {
        const columna = document.createElement("div");
        columna.className = "galeria-columna";
        galeria.appendChild(columna);
        columnas.push(columna);
    }
    visibles.forEach(function (imagen, posicion) {
        const columna = posicion % total;
        const fila = Math.floor(posicion / total);
        columnas[columna].appendChild(crearTarjeta(imagen, alturas[(fila + columna) % alturas.length]));
    });

    // En "Todas" no se muestra el total; solo cuando se reduce por categoría, búsqueda o filtros
    const seReduce = categoriaActiva !== null || texto !== "" || cantidadDeFiltros() > 0;
    contador.textContent = seReduce ? visibles.length + (visibles.length === 1 ? " imagen" : " imágenes") : "";

    if (visibles.length === 0) {
        mensaje.textContent = seReduce ? "No hay imágenes con esos filtros." : "No hay imágenes para mostrar.";
    } else {
        mensaje.textContent = "";
    }
    actualizarPanelFiltros(visibles.length);
}

function guardarImagenes(lista) {
    imagenes = lista;
    llenarAutores();
    mostrarImagenes();
}

function mostrarError(texto) {
    galeria.textContent = "";
    mensaje.textContent = texto;
}

function cargarImagenes(categoriaId) {
    categoriaActiva = categoriaId;
    mensaje.textContent = "Cargando imágenes…";
    let ruta = "/imagenes?visitante_id=" + USUARIO_ACTUAL;
    if (categoriaId) {
        ruta = ruta + "&categoria_id=" + categoriaId;
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

// ---------- Paneles desplegables ----------
const [botonFiltros, botonOrden] = document.querySelectorAll(".herramientas > .boton.boton-blanco");
const botonFiltrosMovil = document.querySelector(".herramientas > .boton-icono");
const paneles = [];

function envolver(boton, panel) {
    const contenedor = document.createElement("div");
    contenedor.className = "desplegable";
    boton.before(contenedor);
    contenedor.append(boton, panel);
    paneles.push(panel);
}

function alternarPanel(panel, evento) {
    evento.stopPropagation();
    const abrir = panel.hidden;
    paneles.forEach(function (p) { p.hidden = true; });
    panel.hidden = !abrir;
}

document.addEventListener("click", function (evento) {
    paneles.forEach(function (panel) {
        if (!panel.hidden && !panel.contains(evento.target)) {
            panel.hidden = true;
        }
    });
});
document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
        paneles.forEach(function (panel) { panel.hidden = true; });
    }
});

function grupoDeOpciones(titulo, clave, valores) {
    const grupo = document.createElement("div");
    const nombre = document.createElement("p");
    nombre.className = "panel-titulo";
    nombre.textContent = titulo;
    const opciones = document.createElement("div");
    opciones.className = "panel-opciones";
    valores.forEach(function (valor) {
        const opcion = document.createElement("button");
        opcion.type = "button";
        opcion.className = "opcion";
        opcion.dataset.clave = clave;
        opcion.dataset.valor = valor[0];
        opcion.textContent = valor[1];
        opcion.addEventListener("click", function () {
            filtros[clave] = valor[0];
            mostrarImagenes();
        });
        opciones.appendChild(opcion);
    });
    grupo.append(nombre, opciones);
    return grupo;
}

const panelFiltros = document.createElement("div");
panelFiltros.className = "panel-desplegable";
panelFiltros.hidden = true;
panelFiltros.addEventListener("click", function (evento) { evento.stopPropagation(); });

panelFiltros.append(
    grupoDeOpciones("Visibilidad", "visibilidad", [["Todas", "Todas"], ["Pública", "Públicas"], ["Privada", "Privadas"]]),
    grupoDeOpciones("Formato", "formato", [["Todos", "Todos"], ["JPG", "JPG"], ["PNG", "PNG"], ["WEBP", "WEBP"], ["SVG", "SVG"]]),
);

const grupoAutor = document.createElement("div");
grupoAutor.innerHTML = '<p class="panel-titulo">Autor</p>';
const selectAutor = document.createElement("select");
selectAutor.addEventListener("change", function () {
    filtros.autor = selectAutor.value;
    mostrarImagenes();
});
grupoAutor.appendChild(selectAutor);

const grupoMostrar = document.createElement("div");
grupoMostrar.innerHTML = '<p class="panel-titulo">Mostrar solo</p>';
function casilla(texto, clave) {
    const etiqueta = document.createElement("label");
    etiqueta.className = "casilla";
    const entrada = document.createElement("input");
    entrada.type = "checkbox";
    entrada.dataset.clave = clave;
    entrada.addEventListener("change", function () {
        filtros[clave] = entrada.checked;
        mostrarImagenes();
    });
    etiqueta.append(entrada, texto);
    return etiqueta;
}
grupoMostrar.append(casilla("Las que me gustan", "meGusta"), casilla("Las que guardé", "guardadas"));

const pie = document.createElement("div");
pie.className = "panel-pie";
const limpiar = document.createElement("button");
limpiar.type = "button";
limpiar.className = "enlace-limpiar";
limpiar.textContent = "Limpiar filtros";
limpiar.addEventListener("click", function () {
    filtros = Object.assign({}, FILTROS_VACIOS);
    mostrarImagenes();
});
const verResultados = document.createElement("button");
verResultados.type = "button";
verResultados.className = "boton boton-verde";
verResultados.addEventListener("click", function () { panelFiltros.hidden = true; });
pie.append(limpiar, verResultados);

panelFiltros.append(grupoAutor, grupoMostrar, pie);
envolver(botonFiltros, panelFiltros);
botonFiltros.addEventListener("click", function (evento) { alternarPanel(panelFiltros, evento); });
if (botonFiltrosMovil) {
    botonFiltrosMovil.addEventListener("click", function (evento) { alternarPanel(panelFiltros, evento); });
}

const cuentaFiltros = document.createElement("span");
cuentaFiltros.className = "cuenta-filtros";
cuentaFiltros.hidden = true;
botonFiltros.appendChild(cuentaFiltros);

function llenarAutores() {
    const autores = new Map();
    imagenes.forEach(function (imagen) { autores.set(String(imagen.usuario.id), imagen.usuario.nombre); });
    if (filtros.autor !== "" && !autores.has(filtros.autor)) {
        filtros.autor = "";
    }
    selectAutor.textContent = "";
    selectAutor.appendChild(new Option("Todos los autores", ""));
    Array.from(autores.entries())
        .sort(function (a, b) { return a[1].localeCompare(b[1], "es"); })
        .forEach(function (autor) { selectAutor.appendChild(new Option(autor[1], autor[0])); });
    selectAutor.value = filtros.autor;
}

function actualizarPanelFiltros(resultados) {
    panelFiltros.querySelectorAll(".opcion").forEach(function (opcion) {
        opcion.classList.toggle("activa", filtros[opcion.dataset.clave] === opcion.dataset.valor);
    });
    panelFiltros.querySelectorAll(".casilla input").forEach(function (entrada) {
        entrada.checked = Boolean(filtros[entrada.dataset.clave]);
    });
    selectAutor.value = filtros.autor;
    verResultados.textContent = "Ver " + resultados + (resultados === 1 ? " imagen" : " imágenes");
    const cantidad = cantidadDeFiltros();
    cuentaFiltros.hidden = cantidad === 0;
    cuentaFiltros.textContent = cantidad;
    limpiar.style.visibility = cantidad === 0 ? "hidden" : "visible";
}

// Orden
const panelOrden = document.createElement("div");
panelOrden.className = "panel-desplegable panel-orden";
panelOrden.hidden = true;
const textoOrden = Array.from(botonOrden.childNodes).reverse().find(function (nodo) {
    return nodo.nodeType === Node.TEXT_NODE && nodo.textContent.trim() !== "";
});
ORDENES.forEach(function (opcion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "opcion-orden" + (opcion.clave === orden ? " activa" : "");
    boton.textContent = opcion.texto;
    boton.addEventListener("click", function (evento) {
        evento.stopPropagation();
        orden = opcion.clave;
        panelOrden.querySelectorAll(".opcion-orden").forEach(function (b) { b.classList.toggle("activa", b === boton); });
        textoOrden.textContent = " " + opcion.texto + " ";
        panelOrden.hidden = true;
        mostrarImagenes();
    });
    panelOrden.appendChild(boton);
});
envolver(botonOrden, panelOrden);
botonOrden.addEventListener("click", function (evento) { alternarPanel(panelOrden, evento); });

// Si cambia el ancho (por ejemplo, de 4 a 3 columnas) se vuelve a acomodar
let columnasActuales = numeroDeColumnas();
window.addEventListener("resize", function () {
    if (numeroDeColumnas() !== columnasActuales) {
        columnasActuales = numeroDeColumnas();
        mostrarImagenes();
    }
});

buscarEscritorio.addEventListener("input", mostrarImagenes);
buscarMovil.addEventListener("input", mostrarImagenes);

llamarApi("GET", "/categorias", null, mostrarCategorias, function () {});
cargarImagenes(null);
