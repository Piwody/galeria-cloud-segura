const filas = document.getElementById("filas");
const tarjetas = document.getElementById("tarjetas");
const plantillaFila = document.getElementById("plantilla-fila");
const plantillaTarjeta = document.getElementById("plantilla-tarjeta");
const buscarEscritorio = document.getElementById("buscar-escritorio");
const buscarMovil = document.getElementById("buscar-movil");
const filtroRol = document.getElementById("filtro-rol");
const filtroRolMovil = document.getElementById("filtro-rol-movil");
const filtroEstado = document.getElementById("filtro-estado");
const formNuevo = document.getElementById("form-nuevo");
const formEditar = document.getElementById("form-editar");

let usuarios = [];
let elegido = null;

function claseRol(rol) {
    if (rol === "Administrador") return "insignia-verde";
    if (rol === "Editor") return "insignia-crema";
    return "insignia-gris";
}

function claseEstado(estado) {
    if (estado === "Activo") return "insignia-verde";
    if (estado === "Suspendido") return "insignia-vino";
    return "insignia-gris";
}

function puntoEstado(estado) {
    if (estado === "Activo") return "img/punto-verde.svg";
    if (estado === "Suspendido") return "img/punto-vino.svg";
    return "img/punto-gris.svg";
}

function llenarDatos(copia, usuario) {
    const avatar = copia.querySelector(".avatar");
    avatar.textContent = iniciales(usuario.nombre);
    avatar.classList.add(colorAvatar(usuario.id));
    copia.querySelector(".persona-nombre").textContent = usuario.nombre;

    const rol = copia.querySelector(".rol");
    rol.textContent = usuario.rol;
    rol.classList.add(claseRol(usuario.rol));

    copia.querySelector(".estado").classList.add(claseEstado(usuario.estado));
    copia.querySelector(".estado img").src = puntoEstado(usuario.estado);
    copia.querySelector(".estado-texto").textContent = usuario.estado;
}

function crearFila(usuario) {
    const fila = plantillaFila.content.cloneNode(true);
    llenarDatos(fila, usuario);
    fila.querySelector(".persona-correo").textContent = usuario.correo;
    fila.querySelector(".total-imagenes").textContent = usuario.total_imagenes;

    const iconoEstado = fila.querySelector(".cambiar-estado img");
    if (usuario.estado === "Suspendido") {
        iconoEstado.src = "img/check-fila.svg";
        iconoEstado.alt = "Reactivar";
    } else {
        iconoEstado.src = "img/bloquear.svg";
        iconoEstado.alt = "Suspender";
    }

    const botones = fila.querySelectorAll(".acciones a");
    for (let i = 0; i < botones.length; i++) {
        botones[i].addEventListener("click", function () {
            elegir(usuario);
        });
    }
    return fila;
}

function crearTarjeta(usuario) {
    const tarjeta = plantillaTarjeta.content.cloneNode(true);
    llenarDatos(tarjeta, usuario);
    tarjeta.querySelector(".usuario").classList.add("estado-" + usuario.estado.toLowerCase());
    tarjeta.querySelector(".mas-opciones").addEventListener("click", function () {
        elegir(usuario);
    });
    return tarjeta;
}

function cumpleFiltros(usuario) {
    const texto = (buscarEscritorio.value + buscarMovil.value).toLowerCase();
    const rol = filtroRol.value || filtroRolMovil.value;
    const datos = (usuario.nombre + " " + usuario.correo).toLowerCase();

    if (!datos.includes(texto)) return false;
    if (rol && usuario.rol !== rol) return false;
    if (filtroEstado.value && usuario.estado !== filtroEstado.value) return false;
    return true;
}

function mostrarUsuarios() {
    filas.textContent = "";
    tarjetas.textContent = "";
    let mostrados = 0;
    let activos = 0;
    let administradores = 0;
    let suspendidos = 0;

    for (let i = 0; i < usuarios.length; i++) {
        const usuario = usuarios[i];
        if (usuario.estado === "Activo") activos = activos + 1;
        if (usuario.estado === "Suspendido") suspendidos = suspendidos + 1;
        if (usuario.rol === "Administrador") administradores = administradores + 1;

        if (cumpleFiltros(usuario)) {
            filas.appendChild(crearFila(usuario));
            tarjetas.appendChild(crearTarjeta(usuario));
            mostrados = mostrados + 1;
        }
    }

    document.getElementById("total-usuarios").textContent = usuarios.length;
    document.getElementById("total-activos").textContent = activos;
    document.getElementById("total-admins").textContent = administradores;
    document.getElementById("total-suspendidos").textContent = suspendidos;
    document.getElementById("cuenta-todos").textContent = usuarios.length;
    document.getElementById("mostrando").textContent = "Mostrando " + mostrados + " de " + usuarios.length + " usuarios";

    if (mostrados === 0) {
        document.getElementById("aviso-movil").textContent = "No hay usuarios para mostrar.";
    } else {
        document.getElementById("aviso-movil").textContent = "";
    }
}

function guardarUsuarios(lista) {
    usuarios = lista;
    mostrarUsuarios();
}

function cargarUsuarios() {
    llamarApi("GET", "/usuarios", null, guardarUsuarios, function (texto) {
        document.getElementById("mostrando").textContent = texto;
        document.getElementById("aviso-movil").textContent = texto;
    });
}

function avisar(ventana, texto) {
    document.querySelector("#" + ventana + " .mensaje-error").textContent = texto;
}

function cerrarYRecargar() {
    location.hash = "";
    cargarUsuarios();
}


function elegir(usuario) {
    elegido = usuario;

    formEditar.nombre.value = usuario.nombre;
    formEditar.correo.value = usuario.correo;
    formEditar.contrasena.value = "";
    formEditar.rol.value = usuario.rol;
    formEditar.estado.value = usuario.estado;

    if (usuario.estado === "Suspendido") {
        document.getElementById("estado-titulo").textContent = "¿Reactivar usuario?";
        document.getElementById("estado-texto").textContent = usuario.nombre + " podrá volver a entrar a la plataforma.";
        document.getElementById("opciones-estado").textContent = "Reactivar";
    } else {
        document.getElementById("estado-titulo").textContent = "¿Suspender usuario?";
        document.getElementById("estado-texto").textContent = usuario.nombre + " no podrá entrar hasta que lo reactives.";
        document.getElementById("opciones-estado").textContent = "Suspender";
    }

    document.getElementById("opciones-titulo").textContent = usuario.nombre;
    document.getElementById("eliminar-texto").textContent = "La cuenta de " + usuario.nombre + " se borrará de la base de datos.";
    avisar("editar", "");
    avisar("estado", "");
    avisar("eliminar", "");
}

formNuevo.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const nuevo = {
        nombre: formNuevo.nombre.value,
        correo: formNuevo.correo.value,
        contrasena: formNuevo.contrasena.value,
        rol: formNuevo.rol.value,
    };
    llamarApi("POST", "/usuarios", nuevo, function () {
        formNuevo.reset();
        avisar("nuevo", "");
        cerrarYRecargar();
    }, function (texto) {
        avisar("nuevo", texto);
    });
});

formEditar.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const cambios = {
        nombre: formEditar.nombre.value,
        correo: formEditar.correo.value,
        rol: formEditar.rol.value,
        estado: formEditar.estado.value,
    };
    if (formEditar.contrasena.value !== "") {
        cambios.contrasena = formEditar.contrasena.value;
    }
    llamarApi("PUT", "/usuarios/" + elegido.id, cambios, cerrarYRecargar, function (texto) {
        avisar("editar", texto);
    });
});

document.getElementById("confirmar-estado").addEventListener("click", function () {
    let nuevoEstado = "Suspendido";
    if (elegido.estado === "Suspendido") {
        nuevoEstado = "Activo";
    }
    llamarApi("PUT", "/usuarios/" + elegido.id, { estado: nuevoEstado }, cerrarYRecargar, function (texto) {
        avisar("estado", texto);
    });
});

document.getElementById("confirmar-eliminar").addEventListener("click", function () {
    llamarApi("DELETE", "/usuarios/" + elegido.id, null, cerrarYRecargar, function (texto) {
        avisar("eliminar", texto);
    });
});

document.getElementById("exportar").addEventListener("click", function () {
    let csv = "Nombre,Correo,Rol,Estado,Imágenes\n";
    for (let i = 0; i < usuarios.length; i++) {
        const u = usuarios[i];
        csv = csv + u.nombre + "," + u.correo + "," + u.rol + "," + u.estado + "," + u.total_imagenes + "\n";
    }
    const enlace = document.createElement("a");
    enlace.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    enlace.download = "usuarios.csv";
    enlace.click();
});

buscarEscritorio.addEventListener("input", mostrarUsuarios);
buscarMovil.addEventListener("input", mostrarUsuarios);
filtroRol.addEventListener("input", mostrarUsuarios);
filtroRolMovil.addEventListener("input", mostrarUsuarios);
filtroEstado.addEventListener("input", mostrarUsuarios);

cargarUsuarios();
