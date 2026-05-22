# ── Stage 1: Compile bcOS agent ────────────────────────────────────
FROM node:20-alpine AS agent-build

# Build tools needed for better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY agent/package*.json ./
RUN npm install

COPY agent/src    ./src
COPY agent/tsconfig.json ./
RUN npx tsc

# Prune to production deps only
RUN npm prune --omit=dev

# ── Stage 2: Build the ISO ─────────────────────────────────────────
FROM alpine:3.19 AS iso-builder

RUN apk add --no-cache \
    xorriso \
    curl \
    cpio \
    gzip \
    syslinux \
    mtools \
    findutils \
    bash

WORKDIR /build

# Download official Alpine Linux virt ISO
ARG ALPINE_VER=3.19.1
RUN echo "Descargando Alpine Linux ${ALPINE_VER}..." && \
    curl -fSL --retry 3 \
    "https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-virt-${ALPINE_VER}-x86_64.iso" \
    -o alpine.iso && \
    echo "ISO descargada: $(du -sh alpine.iso | cut -f1)"

# Extract ISO contents
RUN mkdir -p iso-work && \
    xorriso -osirrox on -indev alpine.iso -extract / iso-work/ 2>/dev/null; \
    ls iso-work/

# ── Extraer el initramfs de Alpine ─────────────────────────────────
# El initramfs ES el sistema de archivos completo en Alpine virt
# Lo modificamos directamente en lugar de usar apkovl (que requiere medio escribible)
RUN mkdir -p /initramfs-root && \
    cd /initramfs-root && \
    gunzip -c /build/iso-work/boot/initramfs-virt | cpio -idm 2>/dev/null && \
    echo "Initramfs extraido: $(du -sh /initramfs-root | cut -f1)"

# ── Inyectar bcOS agent en el initramfs ────────────────────────────

# Node.js binary (musl/Alpine, compatible con el sistema)
COPY --from=agent-build /usr/local/bin/node   /initramfs-root/usr/local/bin/node

# Agente compilado
RUN mkdir -p /initramfs-root/opt/bcos-agent
COPY --from=agent-build /app/dist/            /initramfs-root/opt/bcos-agent/dist/
COPY --from=agent-build /app/node_modules/    /initramfs-root/opt/bcos-agent/node_modules/
COPY --from=agent-build /app/package.json     /initramfs-root/opt/bcos-agent/package.json
COPY agent/ui/                                /initramfs-root/opt/bcos-agent/ui/

# Configuracion por defecto (el usuario la llena via web UI)
RUN mkdir -p /initramfs-root/etc/bcvision && \
    echo '{"syslog_udp_port":514,"syslog_tcp_port":514,"web_port":80,"agent_name":"bcOS-Agent","bcvision_url":"","bcvision_api_key":""}' \
    > /initramfs-root/etc/bcvision/config.json && \
    echo '{}' > /initramfs-root/etc/bcvision/brand-map.json

# Directorio de datos SQLite
RUN mkdir -p /initramfs-root/var/lib/bcvision && \
    chmod 700 /initramfs-root/var/lib/bcvision

# Servicio OpenRC
COPY scripts/bcos-agent.initd /initramfs-root/etc/init.d/bcos-agent
RUN chmod +x /initramfs-root/etc/init.d/bcos-agent && \
    mkdir -p /initramfs-root/etc/runlevels/default && \
    ln -sf /etc/init.d/bcos-agent /initramfs-root/etc/runlevels/default/bcos-agent

# Script de primer arranque
RUN mkdir -p /initramfs-root/etc/local.d
COPY scripts/bcos-firstboot.sh /initramfs-root/etc/local.d/00-bcos-firstboot.start
RUN chmod +x /initramfs-root/etc/local.d/00-bcos-firstboot.start

# Habilitar servicio local (ejecuta scripts en etc/local.d)
RUN ln -sf /etc/init.d/local /initramfs-root/etc/runlevels/default/local 2>/dev/null || true

# Issue file (mostrado en el prompt de login)
RUN printf 'Welcome to bcOS — Syslog Agent\nWeb UI: http://<esta-IP>/\n' \
    > /initramfs-root/etc/issue

# Profile: muestra IP al hacer login
RUN mkdir -p /initramfs-root/etc/profile.d && \
    printf '#!/bin/sh\necho ""\necho " bcOS Syslog Agent"\nip -4 addr show eth0 2>/dev/null | grep -oP "(?<=inet )[\d.]+" | while read ip; do\n  echo " Web UI: http://$ip/"\ndone\necho ""\n' \
    > /initramfs-root/etc/profile.d/bcos.sh

# ── Reempacar el initramfs modificado ──────────────────────────────
RUN cd /initramfs-root && \
    find . | cpio -H newc -o 2>/dev/null | gzip > /build/iso-work/boot/initramfs-virt && \
    echo "Nuevo initramfs: $(du -sh /build/iso-work/boot/initramfs-virt | cut -f1)"

# ── Reempacar ISO ──────────────────────────────────────────────────
RUN mkdir -p /output && \
    xorriso -as mkisofs \
      -o /output/bcOS-x86_64.iso \
      -volid "bcOS" \
      -rational-rock \
      -joliet \
      -isohybrid-mbr /usr/share/syslinux/isohdpfx.bin \
      -eltorito-boot boot/syslinux/isolinux.bin \
      -eltorito-catalog boot/syslinux/boot.cat \
      -no-emul-boot -boot-load-size 4 -boot-info-table \
      iso-work/ 2>&1 | tail -5 && \
    echo "" && \
    echo "╔══════════════════════════════════════╗" && \
    echo "║  bcOS ISO lista en /output/          ║" && \
    echo "╚══════════════════════════════════════╝" && \
    ls -lh /output/bcOS-x86_64.iso
