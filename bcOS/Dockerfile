# bcOS ISO Builder
# Produces bcOS-x86_64.iso inside /output/
#
# Build:  docker build -t bcos-builder .
# Run:    docker run --rm -v "$(pwd)/output:/output" bcos-builder

FROM alpine:3.19 AS base

# ── Build tools ────────────────────────────────────────────────────
RUN apk add --no-cache \
    alpine-sdk \
    curl \
    xorriso \
    grub \
    grub-efi \
    mtools \
    squashfs-tools \
    nodejs \
    npm \
    syslinux

# ── Node.js agent: install deps and compile ────────────────────────
WORKDIR /build/agent
COPY agent/package.json agent/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY agent/ ./
RUN npm run build 2>/dev/null || npx tsc || true

# ── ISO staging area ───────────────────────────────────────────────
WORKDIR /staging

# Create Alpine rootfs structure
RUN mkdir -p \
    rootfs/etc/bcvision \
    rootfs/etc/init.d \
    rootfs/etc/local.d \
    rootfs/opt/bcos-agent/dist \
    rootfs/opt/bcos-agent/node_modules \
    rootfs/opt/bcos-agent/ui \
    rootfs/usr/share/bcos \
    boot/grub

# Copy compiled agent
RUN cp -r /build/agent/dist/*       rootfs/opt/bcos-agent/dist/ 2>/dev/null || true
RUN cp -r /build/agent/node_modules rootfs/opt/bcos-agent/
RUN cp -r /build/agent/ui/          rootfs/opt/bcos-agent/ui/
RUN cp    /build/agent/package.json rootfs/opt/bcos-agent/

# Default config (empty — user configures via web UI on first boot)
RUN echo '{}' > rootfs/etc/bcvision/config.json

# ── OpenRC service script ───────────────────────────────────────────
COPY scripts/bcos-agent.initd rootfs/etc/init.d/bcos-agent
RUN chmod +x rootfs/etc/init.d/bcos-agent

# ── GRUB config ─────────────────────────────────────────────────────
COPY iso/grub/grub.cfg boot/grub/grub.cfg

# ── Alpine minimal base system via apkovl ───────────────────────────
# Download Alpine mini rootfs for the target architecture
RUN ALPINE_VER=3.19.1 && \
    curl -fsSL "https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-minirootfs-${ALPINE_VER}-x86_64.tar.gz" \
         -o /tmp/alpine-minirootfs.tar.gz && \
    tar -xzf /tmp/alpine-minirootfs.tar.gz -C rootfs/

# Install Node.js in the rootfs (for running our agent)
RUN chroot rootfs /bin/sh -c "apk add --no-cache nodejs npm openrc" 2>/dev/null || true

# Enable the agent service
RUN chroot rootfs /bin/sh -c "rc-update add bcos-agent default" 2>/dev/null || true

# ── Create squashfs rootfs ──────────────────────────────────────────
RUN mksquashfs rootfs/ boot/rootfs.squashfs \
    -comp xz -Xbcj x86 \
    -b 1M -no-progress

# ── Extract kernel + initrd from Alpine ISO ─────────────────────────
RUN ALPINE_VER=3.19.1 && \
    curl -fsSL "https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-standard-${ALPINE_VER}-x86_64.iso" \
         -o /tmp/alpine.iso && \
    xorriso -osirrox on -indev /tmp/alpine.iso -extract /boot/vmlinuz-lts boot/vmlinuz-lts && \
    xorriso -osirrox on -indev /tmp/alpine.iso -extract /boot/initramfs-lts boot/initramfs-lts

# ── Assemble ISO with GRUB ──────────────────────────────────────────
RUN grub-mkrescue \
    --output=/output/bcOS-x86_64.iso \
    /staging/boot \
    -- \
    -volid "bcOS" \
    -appid "bcOS Syslog Agent" \
    2>&1

RUN echo "[bcOS] ISO creada en /output/bcOS-x86_64.iso" && \
    ls -lh /output/bcOS-x86_64.iso
