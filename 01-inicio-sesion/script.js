const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const mensajeLogin = document.getElementById("mensaje-login");
const mensajeRegistro = document.getElementById("mensaje-registro");
const botonIngresar = document.getElementById("boton-ingresar");
const botonRegistrar = document.getElementById("boton-registrar");

cerrarSesion();

function avisar(elemento, texto, esExito) {
    elemento.textContent = texto;
    elemento.classList.toggle("exito", Boolean(esExito));
}

formLogin.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const datos = {
        identificador: formLogin.correo.value.trim(),
        contrasena: formLogin.contrasena.value,
    };
    botonIngresar.disabled = true;
    avisar(mensajeLogin, "");

    llamarApi(
        "POST",
        "/auth/login",
        datos,
        function (usuario) {
            guardarSesion(usuario, formLogin.recordar.checked);
            location.href = "../02-galeria-principal/index.html";
        },
        function (texto) {
            avisar(mensajeLogin, texto);
            botonIngresar.disabled = false;
        },
    );
});

// ---------- Reglas del registro ----------
const SOLO_LETRAS = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g;
const REGLAS_CONTRASENA = {
    largo: function (valor) { return valor.length >= 8; },
    mayuscula: function (valor) { return /[A-ZÁÉÍÓÚÜÑ]/.test(valor); },
    numero: function (valor) { return /[0-9]/.test(valor); },
};

// Nombre y apellido: se borra al instante lo que no sea letra (números, espacios, símbolos)
[formRegistro.nombre, formRegistro.apellido].forEach(function (campo) {
    campo.addEventListener("input", function () {
        const limpio = campo.value.replace(SOLO_LETRAS, "");
        if (limpio !== campo.value) {
            campo.value = limpio;
        }
    });
});

// Usuario: se permiten letras, números y símbolos, pero no espacios ni @
formRegistro.usuario.addEventListener("input", function () {
    const limpio = formRegistro.usuario.value.replace(/[\s@]/g, "");
    if (limpio !== formRegistro.usuario.value) {
        formRegistro.usuario.value = limpio;
    }
});

// Contraseña: cada requisito se marca como listo mientras se escribe
function revisarContrasena() {
    const valor = formRegistro.contrasena.value;
    let todas = true;
    document.querySelectorAll("#requisitos-contrasena li").forEach(function (item) {
        const cumple = REGLAS_CONTRASENA[item.dataset.regla](valor);
        item.classList.toggle("cumple", cumple);
        todas = todas && cumple;
    });
    formRegistro.contrasena.setCustomValidity(todas ? "" : "La contraseña todavía no cumple todos los requisitos.");
    return todas;
}
formRegistro.contrasena.addEventListener("input", revisarContrasena);
revisarContrasena();

formRegistro.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (!revisarContrasena()) {
        avisar(mensajeRegistro, "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.");
        return;
    }
    const nuevo = {
        nombre: formRegistro.nombre.value.trim(),
        apellido: formRegistro.apellido.value.trim(),
        usuario: formRegistro.usuario.value.trim(),
        correo: formRegistro.correo.value.trim(),
        contrasena: formRegistro.contrasena.value,
    };
    botonRegistrar.disabled = true;
    avisar(mensajeRegistro, "");

    llamarApi(
        "POST",
        "/auth/registro",
        nuevo,
        function (usuario) {
            botonRegistrar.disabled = false;
            formRegistro.reset();
            revisarContrasena();
            location.hash = "";
            formLogin.correo.value = usuario.correo;
            formLogin.contrasena.value = "";
            formLogin.contrasena.focus();
            avisar(mensajeLogin, "Cuenta creada. Escribe tu contraseña para ingresar.", true);
        },
        function (texto) {
            avisar(mensajeRegistro, texto);
            botonRegistrar.disabled = false;
        },
    );
});
