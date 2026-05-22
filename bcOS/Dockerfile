# ── Stage 1: Compile bcOS agent ────────────────────────────────────
FROM node:20-alpine AS agent-build

WORKDIR /app
COPY agent/package*.json ./
RUN npm install --ignore-scripts && npm rebuild

COPY agent/src    ./src
COPY agent/tsconfig.json ./
RUN npx tsc

# Prune to production deps only
RUN npm prune --omit=dev && npm rebuild

# ── Stage 2: Build the ISO ─────────────────────────────────────────
FROM alpine:3.19 AS iso-builder

RUN apk add --no-cache \
    xorriso \
    curl \
    tar \
    cpio \
    gzip \
    syslinux \
    mtools \
    findutils \
    bash

WORKDIR /build

# Download official Alpine Linux virt ISO (small ~60 MB, no extra packages)
ARG ALPINE_VER=3.19.1
RUN echo "Descargando Alpine Linux ${ALPINE_VER}..." && \
    curl -fSL --retry 3 \
    "https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-virt-${ALPINE_VER}-x86_64.iso" \
    -o alpine.iso && \
    echo "ISO descargada: $(du -sh alpine.iso | cut -f1)"

# Extract ISO contents (xorriso can do this without privileges)
RUN mkdir -p iso-work && \
    xorriso -osirrox on -indev alpine.iso -extract / iso-work/ 2>/dev/null; \
    ls iso-work/

# ── Build bcOS overlay (apkovl format) ─────────────────────────────
# Alpine's apkovl mechanism loads this tar.gz on boot to restore config

WORKDIR /overlay

# Copy Node.js binary compiled for musl/Alpine from stage 1
COPY --from=agent-build /usr/local/bin/node   usr/local/bin/node
COPY --from=agent-build /usr/local/lib/       usr/local/lib/

# Copy compiled agent
RUN mkdir -p opt/bcos-agent
COPY --from=agent-build /app/dist/            opt/bcos-agent/dist/
COPY --from=agent-build /app/node_modules/    opt/bcos-agent/node_modules/
COPY --from=agent-build /app/package.json     opt/bcos-agent/package.json
COPY agent/ui/                                opt/bcos-agent/ui/

# Default config (empty — user fills via web UI)
RUN mkdir -p etc/bcvision && echo '{"syslog_udp_port":514,"syslog_tcp_port":514,"web_port":80,"agent_name":"bcOS-Agent","bcvision_url":"","bcvision_api_key":""}' \
    > etc/bcvision/config.json

# Default brand map (empty)
RUN echo '{}' > etc/bcvision/brand-map.json

# OpenRC service script
RUN mkdir -p etc/init.d etc/runlevels/default
COPY scripts/bcos-agent.initd etc/init.d/bcos-agent
RUN chmod +x etc/init.d/bcos-agent && \
    ln -sf /etc/init.d/bcos-agent etc/runlevels/default/bcos-agent

# Auto-install packages on first boot (sets up networking + node dependencies)
RUN mkdir -p etc/local.d
COPY scripts/bcos-firstboot.sh etc/local.d/00-bcos-firstboot.start
RUN chmod +x etc/local.d/00-bcos-firstboot.start

# Enable local service (runs etc/local.d scripts)
RUN ln -sf /etc/init.d/local etc/runlevels/default/local

# Issue file (shown at login prompt)
RUN printf 'Welcome to bcOS — Syslog Agent\nAccede a la Web UI: http://<esta-IP>/\n' > etc/issue

# Profile: show IP on login
RUN mkdir -p etc/profile.d && printf '#!/bin/sh\necho ""\necho " bcOS Syslog Agent"\nip -4 addr show eth0 2>/dev/null | grep -oP "(?<=inet )[\d.]+" | while read ip; do\n  echo " Web UI: http://$ip/"\ndone\necho ""\n' > etc/profile.d/bcos.sh

# Pack apkovl
WORKDIR /build
RUN tar -czf bcos.apkovl.tar.gz -C /overlay . && \
    echo "apkovl: $(du -sh bcos.apkovl.tar.gz | cut -f1)"

# ── Inject apkovl into Alpine ISO ──────────────────────────────────
# Copy apkovl to ISO work directory
RUN cp bcos.apkovl.tar.gz iso-work/bcos.apkovl.tar.gz

# Patch GRUB config to load our overlay on boot
# The apkovl= parameter tells Alpine's init to load the overlay file
RUN if [ -f iso-work/boot/grub/grub.cfg ]; then \
      sed -i 's|modules=loop,squashfs|modules=loop,squashfs,overlay|g' iso-work/boot/grub/grub.cfg; \
      sed -i 's|quiet|quiet apkovl=/bcos.apkovl.tar.gz|g' iso-work/boot/grub/grub.cfg; \
      cat iso-work/boot/grub/grub.cfg; \
    fi

# Patch syslinux config too (fallback for BIOS boot)
RUN for cfg in iso-work/boot/syslinux/syslinux.cfg iso-work/boot/syslinux/extlinux.conf iso-work/syslinux.cfg; do \
      if [ -f "$cfg" ]; then \
        sed -i 's|quiet|quiet apkovl=/bcos.apkovl.tar.gz|g' "$cfg"; \
      fi; \
    done

# ── Repack ISO ─────────────────────────────────────────────────────
# Use xorriso to create a new hybrid ISO (BIOS + EFI compatible)
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
