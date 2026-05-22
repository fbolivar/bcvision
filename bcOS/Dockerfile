# ── Stage 1: Compile bcOS agent ────────────────────────────────────
FROM node:20-alpine AS agent-build

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY agent/package*.json ./
RUN npm install

COPY agent/src    ./src
COPY agent/tsconfig.json ./
RUN npx tsc

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

ARG ALPINE_VER=3.19.1
RUN echo "Descargando Alpine Linux ${ALPINE_VER}..." && \
    curl -fSL --retry 3 \
    "https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-virt-${ALPINE_VER}-x86_64.iso" \
    -o alpine.iso && \
    echo "ISO descargada: $(du -sh alpine.iso | cut -f1)"

RUN mkdir -p iso-work && \
    xorriso -osirrox on -indev alpine.iso -extract / iso-work/ 2>/dev/null; \
    ls iso-work/

# ── Extraer initramfs ──────────────────────────────────────────────
RUN mkdir -p /initramfs-root && \
    cd /initramfs-root && \
    gunzip -c /build/iso-work/boot/initramfs-virt | cpio -idm 2>/dev/null && \
    echo "Initramfs extraido: $(du -sh /initramfs-root | cut -f1)" && \
    grep -n "switch_root" /initramfs-root/init 2>/dev/null | head -5 || echo "WARNING: no /init"

# ── Inyectar archivos del agente en el initramfs ───────────────────
RUN mkdir -p /initramfs-root/opt/bcos-agent
COPY --from=agent-build /app/dist/            /initramfs-root/opt/bcos-agent/dist/
COPY --from=agent-build /app/node_modules/    /initramfs-root/opt/bcos-agent/node_modules/
COPY --from=agent-build /app/package.json     /initramfs-root/opt/bcos-agent/package.json
COPY agent/ui/                                /initramfs-root/opt/bcos-agent/ui/

RUN mkdir -p /initramfs-root/etc/bcvision && \
    echo '{"syslog_udp_port":514,"syslog_tcp_port":514,"web_port":80,"agent_name":"bcOS-Agent","bcvision_url":"","bcvision_api_key":""}' \
        > /initramfs-root/etc/bcvision/config.json && \
    echo '{}' > /initramfs-root/etc/bcvision/brand-map.json

RUN mkdir -p /initramfs-root/var/lib/bcvision && chmod 700 /initramfs-root/var/lib/bcvision

COPY scripts/bcos-agent.initd /initramfs-root/etc/init.d/bcos-agent
RUN chmod +x /initramfs-root/etc/init.d/bcos-agent

RUN mkdir -p /initramfs-root/etc/local.d
COPY scripts/bcos-firstboot.sh /initramfs-root/etc/local.d/00-bcos-firstboot.start
RUN chmod +x /initramfs-root/etc/local.d/00-bcos-firstboot.start

RUN mkdir -p /initramfs-root/etc/profile.d && \
    printf '#!/bin/sh\necho ""\necho " bcOS Syslog Agent"\nip -4 addr show eth0 2>/dev/null | grep -oP "(?<=inet )[\d.]+" | while read ip; do\n  echo " Web UI: http://$ip/"\ndone\necho ""\n' \
        > /initramfs-root/etc/profile.d/bcos.sh && \
    printf 'Welcome to bcOS — Syslog Agent\nWeb UI: http://<esta-IP>/\n' \
        > /initramfs-root/etc/issue

# ── Parchear /init para copiar archivos a sysroot antes del switch_root ──
# Alpine hace switch_root a un tmpfs limpio — necesitamos copiar nuestros
# archivos al nuevo root ANTES del pivot (por eso usamos un script externo
# en lugar de heredoc para evitar errores de parseo del Dockerfile).
COPY scripts/bcos-inject.sh /tmp/bcos-inject.sh
RUN INIT=/initramfs-root/init && \
    if [ ! -f "$INIT" ]; then echo "ERROR: /init no encontrado"; exit 1; fi && \
    LINE=$(grep -n "exec switch_root" "$INIT" | tail -1 | cut -d: -f1) && \
    if [ -z "$LINE" ]; then echo "ERROR: switch_root no encontrado en /init"; exit 1; fi && \
    echo "Parcheando /init en linea $LINE ..." && \
    head -n $((LINE - 1)) "$INIT" > /tmp/init.new && \
    cat /tmp/bcos-inject.sh >> /tmp/init.new && \
    tail -n +"$LINE" "$INIT" >> /tmp/init.new && \
    mv /tmp/init.new "$INIT" && \
    chmod +x "$INIT" && \
    echo "=== Patch aplicado ===" && \
    grep -n "bcOS\|switch_root" "$INIT" | tail -8

# ── Reempacar initramfs ────────────────────────────────────────────
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
