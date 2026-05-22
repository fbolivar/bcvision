#!/bin/sh
# Bloque que se inyecta en /init de Alpine ANTES de exec switch_root
# Copia los archivos del agente al nuevo root (sysroot) antes del pivot

# === bcOS Agent install ===
if [ -d /opt/bcos-agent ]; then
  _t="${sysroot:-${NEWROOT:-/sysroot}}"
  echo "[bcOS] Instalando agente en $_t ..."
  mkdir -p "$_t/opt" "$_t/usr/local/bin" \
           "$_t/etc/bcvision" "$_t/etc/runlevels/default" \
           "$_t/etc/local.d" "$_t/etc/profile.d" \
           "$_t/var/lib/bcvision"
  cp -a /opt/bcos-agent "$_t/opt/"
  cp /usr/local/bin/node "$_t/usr/local/bin/"
  cp /etc/bcvision/config.json "$_t/etc/bcvision/"
  cp /etc/bcvision/brand-map.json "$_t/etc/bcvision/"
  cp /etc/init.d/bcos-agent "$_t/etc/init.d/"
  chmod +x "$_t/etc/init.d/bcos-agent"
  ln -sf /etc/init.d/bcos-agent "$_t/etc/runlevels/default/bcos-agent"
  cp /etc/local.d/00-bcos-firstboot.start "$_t/etc/local.d/"
  chmod +x "$_t/etc/local.d/00-bcos-firstboot.start"
  ln -sf /etc/init.d/local "$_t/etc/runlevels/default/local" 2>/dev/null || true
  cp /etc/profile.d/bcos.sh "$_t/etc/profile.d/"
  cp /etc/issue "$_t/etc/issue"
  chmod 700 "$_t/var/lib/bcvision"
  echo "[bcOS] Agente instalado correctamente"
fi
# === end bcOS ===
