import hashlib
import secrets


def cifrar_contrasena(contrasena: str) -> str:
    sal = secrets.token_hex(16)
    clave = hashlib.pbkdf2_hmac("sha256", contrasena.encode(), sal.encode(), 200_000)
    return f"{sal}${clave.hex()}"


def verificar_contrasena(contrasena: str, guardada: str) -> bool:
    sal, clave = guardada.split("$")
    nueva = hashlib.pbkdf2_hmac("sha256", contrasena.encode(), sal.encode(), 200_000)
    return secrets.compare_digest(nueva.hex(), clave)
