#!/bin/sh
# bcOS first-boot setup — runs once via OpenRC local.d
# Installs runtime dependencies that couldn't be bundled in the apkovl

MARKER=/etc/bcvision/.firstboot-done
[ -f "$MARKER" ] && exit 0

echo "[bcOS] Configurando sistema en primer arranque..."

# Setup Alpine APK repositories
cat > /etc/apk/repositories << 'EOF'
https://dl-cdn.alpinelinux.org/alpine/v3.19/main
https://dl-cdn.alpinelinux.org/alpine/v3.19/community
EOF

# Update APK and install runtime deps
apk update --quiet
apk add --no-cache --quiet \
    sqlite \
    openssl \
    ca-certificates \
    tzdata

# Set timezone to America/Bogota by default
cp /usr/share/zoneinfo/America/Bogota /etc/localtime
echo "America/Bogota" > /etc/timezone

# Create data directory for SQLite
mkdir -p /var/lib/bcvision
chmod 700 /var/lib/bcvision

# Enable and start the bcOS agent service
rc-update add bcos-agent default 2>/dev/null || true
rc-service bcos-agent start 2>/dev/null || true

# Mark first boot complete
touch "$MARKER"

echo "[bcOS] Primer arranque completado."
echo "[bcOS] Agente iniciado en puerto 514 (syslog) y 80 (web UI)"
