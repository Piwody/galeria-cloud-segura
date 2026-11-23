# Enciende el backend de Muralia desde cualquier lugar: .\iniciar.ps1
# Activa el entorno virtual, entra a la carpeta backend y arranca la API en http://localhost:8000
$raiz = $PSScriptRoot
if (-not (Test-Path "$raiz\.venv\Scripts\Activate.ps1")) {
    Write-Host "Primero crea el entorno: python -m venv .venv  y  python -m pip install -r backend\requirements.txt" -ForegroundColor Yellow
    exit 1
}
& "$raiz\.venv\Scripts\Activate.ps1"
Set-Location "$raiz\backend"
python -m uvicorn app.main:app --reload
