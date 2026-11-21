const API_URL = "http://localhost:8000";

const CLAVE_SESION = "muralia_usuario";

function usuarioActual() {
    try {
        const guardado = localStorage.getItem(CLAVE_SESION) || sessionStorage.getItem(CLAVE_SESION);
        return guardado ? JSON.parse(guardado) : null;
    } catch (error) {
        return null;
    }
}

function guardarSesion(usuario, recordar) {
    try {
        localStorage.removeItem(CLAVE_SESION);
        sessionStorage.removeItem(CLAVE_SESION);
        const almacen = recordar ? localStorage : sessionStorage;
        almacen.setItem(CLAVE_SESION, JSON.stringify(usuario));
    } catch (error) {
    }
}

function cerrarSesion() {
    try {
        localStorage.removeItem(CLAVE_SESION);
        sessionStorage.removeItem(CLAVE_SESION);
    } catch (error) {
    }
}

const USUARIO_ACTUAL = usuarioActual() ? usuarioActual().id : null;


function llamarApi(metodo, ruta, datos, siTodoBien, siHayError) {
    const opciones = { method: metodo };

    if (datos instanceof FormData) {
        opciones.body = datos;
    } else if (datos) {
        opciones.headers = { "Content-Type": "application/json" };
        opciones.body = JSON.stringify(datos);
    }

    fetch(API_URL + ruta, opciones)
        .then(function (respuesta) {
            if (respuesta.status === 204) {
                siTodoBien(null);
                return;
            }
            respuesta.json().then(function (resultado) {
                if (respuesta.ok) {
                    siTodoBien(resultado);
                } else if (typeof resultado.detail === "string") {
                    siHayError(resultado.detail);
                } else if (Array.isArray(resultado.detail) && resultado.detail.length > 0) {
                    const texto = String(resultado.detail[0].msg);
                    siHayError(texto.startsWith("Value error, ") ? texto.replace("Value error, ", "") : "Revisa los datos del formulario.");
                } else {
                    siHayError("Revisa los datos del formulario.");
                }
            });
        })
        .catch(function () {
            siHayError("No se pudo conectar con el servidor. Revisa que el backend esté encendido.");
        });
}

function iniciales(nombre) {
    const partes = nombre.split(" ");
    let resultado = partes[0].charAt(0);
    if (partes.length > 1) {
        resultado = resultado + partes[1].charAt(0);
    }
    return resultado.toUpperCase();
}

function colorAvatar(id) {
    const colores = ["avatar-verde", "avatar-verde-oscuro", "avatar-vino"];
    return colores[id % 3];
}

function fechaCorta(texto) {
    return texto.substring(8, 10) + "/" + texto.substring(5, 7) + "/" + texto.substring(0, 4);
}

function hora(texto) {
    return texto.substring(11, 16);
}

function idDeLaDireccion() {
    return location.search.replace("?id=", "");
}

// Muestra en la barra lateral y en el encabezado al usuario que inició sesión.
// El rol solo aparece si el usuario es Administrador.
function pintarUsuarioActual() {
    const usuario = usuarioActual();
    if (!usuario) {
        return;
    }
    const esAdmin = usuario.rol === "Administrador";
    const colores = ["avatar-verde", "avatar-verde-oscuro", "avatar-vino"];

    function ponerAvatar(elemento) {
        elemento.textContent = iniciales(usuario.nombre);
        if (colores.some(function (c) { return elemento.classList.contains(c); })) {
            elemento.classList.remove(...colores);
            elemento.classList.add(colorAvatar(usuario.id));
        }
    }

    function ponerRol(elemento) {
        elemento.textContent = esAdmin ? usuario.rol : "";
        elemento.hidden = !esAdmin;
    }

    document.querySelectorAll(".usuario-actual, footer.usuario").forEach(function (bloque) {
        const avatar = bloque.querySelector(".avatar");
        const nombre = bloque.querySelector(".usuario-actual-nombre, .usuario-datos strong");
        const rol = bloque.querySelector(".usuario-actual-rol, .usuario-datos small");
        if (avatar) ponerAvatar(avatar);
        if (nombre) nombre.textContent = usuario.nombre;
        if (rol) ponerRol(rol);
    });

    document.querySelectorAll(".avatar-pequeno").forEach(ponerAvatar);

    const cuenta = document.querySelector("#cuenta .ventana-caja");
    if (cuenta) {
        const nombre = cuenta.querySelector("h2");
        const rol = cuenta.querySelector("h2 + p");
        if (nombre) nombre.textContent = usuario.nombre;
        if (rol) ponerRol(rol);
    }

    const vistaComo = document.querySelector(".vista-como");
    if (vistaComo) {
        vistaComo.textContent = "Vista como: " + usuario.rol;
    }
}

// ---------- Me gusta ----------
const ICONO_CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';

function formatoNumero(numero) {
    return Number(numero || 0).toLocaleString("es-EC");
}

// Crea un botón de corazón para una imagen. opciones.texto agrega "me gusta" al número;
// opciones.clase agrega clases extra (por ejemplo "boton-icono" en el celular)
function crearBotonMeGusta(imagen, opciones) {
    opciones = opciones || {};
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-me-gusta" + (opciones.texto ? " con-texto" : "") + (opciones.clase ? " " + opciones.clase : "");

    function pintar() {
        boton.classList.toggle("activo", Boolean(imagen.le_gusta));
        boton.setAttribute("aria-pressed", imagen.le_gusta ? "true" : "false");
        boton.title = imagen.le_gusta ? "Quitar me gusta" : "Me gusta";
        let texto = "";
        if (!opciones.soloIcono) {
            texto = "<span>" + formatoNumero(imagen.me_gusta) + (opciones.texto ? " me gusta" : "") + "</span>";
        }
        boton.innerHTML = ICONO_CORAZON + texto;
    }

    function cambiar(leGusta, total) {
        imagen.le_gusta = leGusta;
        imagen.me_gusta = total;
        document.dispatchEvent(new CustomEvent("muralia:me-gusta", { detail: imagen }));
    }

    document.addEventListener("muralia:me-gusta", function (evento) {
        if (evento.detail.id === imagen.id) {
            imagen.le_gusta = evento.detail.le_gusta;
            imagen.me_gusta = evento.detail.me_gusta;
            pintar();
        }
    });

    boton.addEventListener("click", function (evento) {
        evento.preventDefault();
        evento.stopPropagation();
        if (USUARIO_ACTUAL === null) {
            return;
        }
        const antes = { le_gusta: imagen.le_gusta, me_gusta: imagen.me_gusta };
        cambiar(!antes.le_gusta, antes.me_gusta + (antes.le_gusta ? -1 : 1));
        boton.classList.remove("latido");
        void boton.offsetWidth;
        if (imagen.le_gusta) {
            boton.classList.add("latido");
        }
        llamarApi("POST", "/imagenes/" + imagen.id + "/me-gusta", { usuario_id: USUARIO_ACTUAL },
            function (respuesta) {
                cambiar(respuesta.le_gusta, respuesta.me_gusta);
            },
            function () {
                cambiar(antes.le_gusta, antes.me_gusta);
            });
    });

    pintar();
    return boton;
}

// ---------- Ventanas (compartir, eliminar, notificaciones…) ----------
function cerrarVentana() {
    const posicion = window.scrollY;
    location.hash = "";
    window.scrollTo(0, posicion);
}

function prepararVentanas() {
    document.querySelectorAll(".ventana").forEach(function (ventana) {
        const caja = ventana.querySelector(".ventana-caja");
        if (caja && !caja.querySelector(".ventana-x")) {
            const x = document.createElement("button");
            x.type = "button";
            x.className = "ventana-x";
            x.setAttribute("aria-label", "Cerrar");
            x.innerHTML = "&times;";
            x.addEventListener("click", cerrarVentana);
            caja.prepend(x);
        }
        // Clic fuera del recuadro: el clic cae sobre el fondo oscuro (la propia .ventana)
        ventana.addEventListener("click", function (evento) {
            if (evento.target === ventana) {
                cerrarVentana();
            }
        });
    });
    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && document.querySelector(".ventana:target")) {
            cerrarVentana();
        }
    });
}

// ---------- Notificaciones ----------
// Son las imágenes que subieron otros usuarios. "Limpiar" guarda la fecha de la última vista.
function claveNotificaciones() {
    return "muralia_notificaciones_" + USUARIO_ACTUAL;
}

function marcaNotificaciones() {
    try {
        return localStorage.getItem(claveNotificaciones()) || "";
    } catch (error) {
        return "";
    }
}

function guardarMarcaNotificaciones(valor) {
    try {
        localStorage.setItem(claveNotificaciones(), valor);
    } catch (error) {
    }
}

function pintarInsigniasNotificaciones(cantidad) {
    document.querySelectorAll('a[href$="#notificaciones"]').forEach(function (campana) {
        campana.classList.add("con-insignia");
        let insignia = campana.querySelector(".insignia-notificaciones");
        if (cantidad === 0) {
            if (insignia) {
                insignia.remove();
            }
            campana.title = "Notificaciones";
            return;
        }
        if (!insignia) {
            insignia = document.createElement("span");
            insignia.className = "insignia-notificaciones";
            campana.appendChild(insignia);
        }
        insignia.textContent = cantidad > 9 ? "9+" : String(cantidad);
        campana.title = cantidad + (cantidad === 1 ? " notificación nueva" : " notificaciones nuevas");
    });
}

function pintarVentanaNotificaciones(nuevas) {
    const ventana = document.getElementById("notificaciones");
    if (!ventana) {
        return;
    }
    const caja = ventana.querySelector(".ventana-caja");
    Array.from(caja.children).forEach(function (hijo) {
        if (!hijo.classList.contains("ventana-x")) {
            hijo.remove();
        }
    });

    const titulo = document.createElement("h2");
    titulo.textContent = "Notificaciones";
    caja.appendChild(titulo);

    if (nuevas.length === 0) {
        const vacio = document.createElement("p");
        vacio.className = "notificaciones-vacio";
        vacio.textContent = "No tienes notificaciones nuevas.";
        caja.appendChild(vacio);
    } else {
        const lista = document.createElement("div");
        lista.className = "lista-notificaciones";
        nuevas.slice(0, 20).forEach(function (imagen) {
            const item = document.createElement("a");
            item.className = "notificacion";
            item.href = "../04-detalle-imagen/index.html?id=" + imagen.id;
            const avatar = document.createElement("span");
            avatar.className = "avatar " + colorAvatar(imagen.usuario.id);
            avatar.textContent = iniciales(imagen.usuario.nombre);
            const texto = document.createElement("span");
            texto.className = "notificacion-texto";
            const nombre = document.createElement("strong");
            nombre.textContent = imagen.usuario.nombre;
            const fecha = document.createElement("span");
            fecha.className = "notificacion-fecha";
            fecha.textContent = fechaCorta(imagen.fecha_registro) + " · " + hora(imagen.fecha_registro);
            texto.append(nombre, " subió «" + imagen.titulo + "»", fecha);
            item.append(avatar, texto);
            lista.appendChild(item);
        });
        caja.appendChild(lista);
    }

    const limpiar = document.createElement("button");
    limpiar.type = "button";
    limpiar.className = "boton boton-verde";
    limpiar.textContent = "Limpiar";
    limpiar.disabled = nuevas.length === 0;
    limpiar.addEventListener("click", function () {
        guardarMarcaNotificaciones(nuevas[0].fecha_registro);
        pintarInsigniasNotificaciones(0);
        pintarVentanaNotificaciones([]);
    });
    caja.appendChild(limpiar);
}

function iniciarNotificaciones() {
    const hayCampana = document.querySelector('a[href$="#notificaciones"]');
    if (!hayCampana || USUARIO_ACTUAL === null) {
        return;
    }
    llamarApi("GET", "/imagenes", null, function (imagenes) {
        const marca = marcaNotificaciones();
        const nuevas = imagenes
            .filter(function (imagen) {
                return imagen.usuario.id !== USUARIO_ACTUAL && imagen.fecha_registro > marca;
            })
            .sort(function (a, b) {
                return b.fecha_registro.localeCompare(a.fecha_registro);
            });
        pintarInsigniasNotificaciones(nuevas.length);
        pintarVentanaNotificaciones(nuevas);
    }, function () {});
}

// Pantallas que solo puede ver un Administrador
const PAGINAS_SOLO_ADMIN = ["05-gestion-usuarios", "08-seguridad"];

function esAdministrador() {
    const usuario = usuarioActual();
    return usuario !== null && usuario.rol === "Administrador";
}

// Si no hay sesión manda al login; si no es admin no lo deja entrar a pantallas de administración
function protegerPagina() {
    const ruta = location.pathname;
    if (ruta.includes("01-inicio-sesion")) {
        return;
    }
    if (usuarioActual() === null) {
        document.documentElement.style.visibility = "hidden";
        location.replace("../01-inicio-sesion/index.html");
        return;
    }
    const esPaginaAdmin = PAGINAS_SOLO_ADMIN.some(function (pagina) { return ruta.includes(pagina); });
    if (esPaginaAdmin && !esAdministrador()) {
        document.documentElement.style.visibility = "hidden";
        location.replace("../02-galeria-principal/index.html");
    }
}

// Oculta a los usuarios que no son admin todo enlace o título de "Administración"
function aplicarPermisos() {
    if (esAdministrador()) {
        return;
    }
    function ocultar(elemento) {
        elemento.style.setProperty("display", "none", "important");
    }
    const selector = PAGINAS_SOLO_ADMIN.map(function (p) { return 'a[href*="' + p + '"]'; }).join(", ");
    document.querySelectorAll(selector).forEach(function (enlace) {
        ocultar(enlace);
        const menu = enlace.closest("nav.menu");
        if (menu && !menu.querySelector("a:not([style*='display: none'])")) {
            ocultar(menu);
        }
    });
    document.querySelectorAll(".menu-titulo").forEach(function (titulo) {
        if (titulo.textContent.trim() === "Administración") {
            ocultar(titulo);
        }
    });
}

protegerPagina();

function iniciarPagina() {
    pintarUsuarioActual();
    aplicarPermisos();
    prepararVentanas();
    iniciarNotificaciones();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPagina);
} else {
    iniciarPagina();
}
