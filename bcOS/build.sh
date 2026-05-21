#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  bcOS ISO Builder                                           ║
# ║  Genera bcOS-x86_64.iso usando Docker                       ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/output"
IMAGE_TAG="bcos-builder:latest"
ISO_NAME="bcOS-x86_64.iso"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

log()   { echo -e "${BLUE}▶${RESET} $*"; }
ok()    { echo -e "${GREEN}✓${RESET} $*"; }
warn()  { echo -e "${YELLOW}⚠${RESET} $*"; }
error() { echo -e "${RED}✗${RESET} $*" >&2; }

banner() {
  echo -e "${BOLD}"
  echo "  ╔══════════════════════════════════════╗"
  echo "  ║   bcOS — Syslog Agent Builder        ║"
  echo "  ║   Virtual Appliance para BCVision    ║"
  echo "  ╚══════════════════════════════════════╝"
  echo -e "${RESET}"
}

check_deps() {
  if ! command -v docker &>/dev/null; then
    error "Docker no está instalado o no está en PATH."
    echo "  Instala Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
  fi
  if ! docker info &>/dev/null; then
    error "Docker no está corriendo. Inicia Docker Desktop y vuelve a intentarlo."
    exit 1
  fi
  ok "Docker disponible"
}

build_image() {
  log "Construyendo imagen Docker del builder..."
  docker build \
    --tag "${IMAGE_TAG}" \
    --file "${SCRIPT_DIR}/Dockerfile" \
    "${SCRIPT_DIR}"
  ok "Imagen construida: ${IMAGE_TAG}"
}

build_iso() {
  mkdir -p "${OUTPUT_DIR}"
  log "Generando ISO (esto puede tardar 3-8 minutos)..."
  docker run --rm \
    --volume "${OUTPUT_DIR}:/output" \
    --name bcos-build-$$ \
    "${IMAGE_TAG}"
  ok "ISO generada en: ${OUTPUT_DIR}/${ISO_NAME}"
}

print_next_steps() {
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${GREEN}  ¡ISO lista!${RESET}  $(ls -lh "${OUTPUT_DIR}/${ISO_NAME}" | awk '{print $5}')"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo -e "${BOLD}Próximos pasos:${RESET}"
  echo "  1. Crea una VM en VMware/VirtualBox/Proxmox:"
  echo "     • 1 CPU, 512 MB RAM, sin disco (modo live)"
  echo "     • Red: Bridged o Host-Only según tu infraestructura"
  echo "     • Bootea desde: ${OUTPUT_DIR}/${ISO_NAME}"
  echo ""
  echo "  2. Al iniciar, bcOS arranca automáticamente."
  echo "     Accede a la Web UI en el navegador:"
  echo -e "     ${BLUE}http://<IP-del-appliance>/${RESET}"
  echo ""
  echo "  3. Completa el wizard de configuración:"
  echo "     • URL de BCVision"
  echo "     • API Key del agente"
  echo ""
  echo "  4. Apunta el Syslog de tus firewalls a esa IP en el puerto 514."
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────
banner
check_deps
build_image
build_iso
print_next_steps
