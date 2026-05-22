#!/bin/sh
# bcOS Auto-Installer — se ejecuta en el primer arranque del live system.
# Detecta si estamos en RAM (tmpfs) o en disco.
# Si es live: instala Alpine + agente en el disco VHD y apaga para que
#             el usuario retire el ISO antes del siguiente encendido.
# Si es disco: solo asegura que el agente esté corriendo.

# ── Si ya estamos instalados en disco, solo arrancar el agente ─────
ROOT_TYPE=$(df -T / 2>/dev/null | awk 'NR==2 {print $2}')
if [ "$ROOT_TYPE" != "tmpfs" ]; then
    rc-service bcos-agent status >/dev/null 2>&1 || rc-service bcos-agent start
    exit 0
fi

# ── Estamos en modo live (tmpfs) — ejecutar instalador ────────────
echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   bcOS — Instalador Automático v1.5               ║"
echo "║   Instalando Alpine + bcOS Agent en disco...       ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Configurar repositorios de Alpine
cat > /etc/apk/repositories << 'REPOS'
https://dl-cdn.alpinelinux.org/alpine/v3.19/main
https://dl-cdn.alpinelinux.org/alpine/v3.19/community
REPOS

echo "[bcOS] Actualizando paquetes (requiere internet)..."
apk update --quiet 2>/dev/null || {
    echo "[bcOS] ADVERTENCIA: Sin internet. Instalacion puede fallar."
}

# ── Encontrar disco destino (VHD, no CD-ROM) ──────────────────────
TARGET=""
for d in sda sdb vda vdb hda hdb; do
    if [ -b "/dev/$d" ]; then
        REMOVABLE=$(cat /sys/block/$d/removable 2>/dev/null)
        if [ "$REMOVABLE" = "0" ]; then
            SIZE=$(blockdev --getsize64 /dev/$d 2>/dev/null || echo 0)
            [ "$SIZE" -gt 1000000000 ] && TARGET="/dev/$d" && break
        fi
    fi
done

if [ -z "$TARGET" ]; then
    echo ""
    echo "[bcOS] ERROR: No se encontró disco virtual."
    echo "[bcOS] La VM necesita un disco VHDX de al menos 20 GB adjunto."
    echo "[bcOS] Agrega el disco en Hyper-V y vuelve a arrancar desde el ISO."
    exit 1
fi

SIZE_GB=$(blockdev --getsize64 $TARGET 2>/dev/null | awk '{printf "%.0f", $1/1073741824}')
echo "[bcOS] Disco encontrado: $TARGET (${SIZE_GB} GB)"
echo "[bcOS] El disco sera formateado. Iniciando en 5 segundos..."
sleep 5

# ── Instalar Alpine Linux en disco (modo sys = instalacion completa) ─
cat > /tmp/bcos-answers << ANSWERS
KEYMAPOPTS="us us"
HOSTNAMEOPTS="-n bcos-agent"
INTERFACEOPTS="eth0 dhcp"
DNSOPTS="-d local -n 8.8.8.8 8.8.4.4"
TIMEZONEOPTS="-z America/Bogota"
PROXYOPTS="none"
APKREPOSOPTS="-r"
SSHDOPTS="-c openssh"
NTPOPTS="-c chrony"
DISKOPTS="-m sys $TARGET"
LBUOPTS="none"
APKCACHEOPTS="none"
ANSWERS

echo "[bcOS] Ejecutando setup-alpine (puede tomar 3-8 minutos)..."
ERASE_DISKS="$TARGET" setup-alpine -f /tmp/bcos-answers
INSTALL_STATUS=$?

if [ $INSTALL_STATUS -ne 0 ]; then
    echo "[bcOS] ERROR: setup-alpine fallo (codigo $INSTALL_STATUS)"
    exit 1
fi

echo "[bcOS] Alpine instalado. Buscando particion raiz..."

# setup-alpine en modo sys crea: sda1=boot, sda2=swap, sda3=root (ext4)
ROOT_PART=""
for p in "${TARGET}3" "${TARGET}1" "${TARGET}p3" "${TARGET}p1"; do
    if [ -b "$p" ] && blkid "$p" 2>/dev/null | grep -qi ext4; then
        ROOT_PART="$p"
        break
    fi
done

# Fallback: buscar cualquier ext4 en el disco
if [ -z "$ROOT_PART" ]; then
    ROOT_PART=$(blkid -t TYPE=ext4 -o device 2>/dev/null | grep "$TARGET" | tail -1)
fi

if [ -z "$ROOT_PART" ]; then
    echo "[bcOS] ERROR: No se encontro particion raiz ext4 en $TARGET"
    blkid | grep "$TARGET"
    exit 1
fi

mkdir -p /mnt
mount "$ROOT_PART" /mnt || {
    echo "[bcOS] ERROR: No se pudo montar $ROOT_PART"
    exit 1
}

echo "[bcOS] Instalando agente bcOS en $ROOT_PART..."

# ── Copiar agente bcOS al sistema instalado ───────────────────────
mkdir -p /mnt/opt/bcos-agent \
         /mnt/usr/local/bin \
         /mnt/etc/bcvision \
         /mnt/var/lib/bcvision \
         /mnt/etc/runlevels/default \
         /mnt/etc/profile.d

cp -a /opt/bcos-agent/. /mnt/opt/bcos-agent/
cp /usr/local/bin/node /mnt/usr/local/bin/node
cp /etc/bcvision/config.json /mnt/etc/bcvision/
cp /etc/bcvision/brand-map.json /mnt/etc/bcvision/
chmod 700 /mnt/var/lib/bcvision

# Servicio OpenRC
cp /etc/init.d/bcos-agent /mnt/etc/init.d/bcos-agent
chmod +x /mnt/etc/init.d/bcos-agent
ln -sf /etc/init.d/bcos-agent /mnt/etc/runlevels/default/bcos-agent

# Profile e issue
cp /etc/profile.d/bcos.sh /mnt/etc/profile.d/bcos.sh 2>/dev/null || true
printf 'Welcome to bcOS — Syslog Agent\nWeb UI: http://<esta-IP>/\n' \
    > /mnt/etc/issue

umount /mnt

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   bcOS instalado correctamente en $TARGET          ║"
echo "║                                                    ║"
echo "║   PROXIMOS PASOS:                                  ║"
echo "║   1. La VM se APAGARA en 30 segundos              ║"
echo "║   2. En Hyper-V: Settings > DVD Drive > None      ║"
echo "║   3. Enciende la VM                               ║"
echo "║   4. Abre http://<IP>/ en el navegador            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

sleep 30
poweroff
