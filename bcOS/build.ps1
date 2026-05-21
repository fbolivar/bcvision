# ╔══════════════════════════════════════════════════════════════╗
# ║  bcOS ISO Builder — Windows (PowerShell)                    ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = 'Stop'
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$OutputDir   = Join-Path $ScriptDir 'output'
$ImageTag    = 'bcos-builder:latest'
$IsoName     = 'bcOS-x86_64.iso'

function Log   { param($m) Write-Host "▶ $m" -ForegroundColor Cyan }
function OK    { param($m) Write-Host "✓ $m" -ForegroundColor Green }
function Error { param($m) Write-Host "✗ $m" -ForegroundColor Red }

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "  ║   bcOS — Syslog Agent Builder        ║" -ForegroundColor Blue
Write-Host "  ║   Virtual Appliance para BCVision    ║" -ForegroundColor Blue
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Error "Docker no está instalado. Descarga Docker Desktop desde https://www.docker.com"
    exit 1
}
try { docker info | Out-Null } catch {
    Error "Docker no está corriendo. Inicia Docker Desktop primero."
    exit 1
}
OK "Docker disponible"

# Build image
Log "Construyendo imagen Docker del builder..."
docker build --tag $ImageTag --file (Join-Path $ScriptDir 'Dockerfile') $ScriptDir
if ($LASTEXITCODE -ne 0) { Error "Error al construir imagen Docker"; exit 1 }
OK "Imagen construida: $ImageTag"

# Build ISO
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }
Log "Generando ISO (esto puede tardar 3-8 minutos)..."
docker run --rm --volume "${OutputDir}:/output" --name "bcos-build-$$" $ImageTag
if ($LASTEXITCODE -ne 0) { Error "Error generando ISO"; exit 1 }
OK "ISO generada en: $OutputDir\$IsoName"

$isoPath = Join-Path $OutputDir $IsoName
$size = (Get-Item $isoPath).Length / 1MB

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ¡ISO lista!  $([math]::Round($size,1)) MB" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor White
Write-Host "  1. Crea una VM (VMware/VirtualBox/Proxmox):"
Write-Host "     • 1 CPU, 512 MB RAM — bootea desde la ISO"
Write-Host "  2. Accede a la Web UI: http://<IP-del-appliance>/"
Write-Host "  3. Completa el wizard con tu URL de BCVision y API Key"
Write-Host "  4. Apunta el Syslog de tus firewalls a esa IP en el puerto 514"
Write-Host ""
