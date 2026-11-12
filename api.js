// Dirección del backend que corre en el computador del equipo
const API_URL = "http://localhost:8000";

// Usuario con el que se registran las imágenes mientras no haya inicio de sesión real
const USUARIO_ACTUAL = 1;

// Llama a la API. Cuando responde bien ejecuta siTodoBien(datos);
// si algo falla ejecuta siHayError(mensaje).
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

// La API manda las fechas así: 2026-10-02T18:42:00
function fechaCorta(texto) {
    return texto.substring(8, 10) + "/" + texto.substring(5, 7) + "/" + texto.substring(0, 4);
}

function hora(texto) {
    return texto.substring(11, 16);
}

// Lee el número que viene en la dirección, por ejemplo index.html?id=4
function idDeLaDireccion() {
    return location.search.replace("?id=", "");
}
