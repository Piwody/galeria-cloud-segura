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
