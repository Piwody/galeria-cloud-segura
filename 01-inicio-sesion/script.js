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

formRegistro.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const nuevo = {
        nombre: formRegistro.nombre.value.trim(),
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
