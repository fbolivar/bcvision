# bcOS — Syslog Agent Virtual Appliance

Sistema operativo ligero basado en Alpine Linux diseñado para recibir logs de firewalls vía Syslog y reenviarlos a BCVision.

## Arquitectura

```
[Firewall] --Syslog UDP/TCP 514--> [bcOS Appliance]
                                         |
                                    [Web UI :80]
                                   (Setup Wizard)
                                         |
                               [BCVision API /api/agent/ingest]
```

## Requisitos de VM

| Recurso | Mínimo |
|---------|--------|
| CPU     | 1 vCPU |
| RAM     | 512 MB |
| Disco   | Ninguno (modo live) o 2 GB |
| Red     | 1 NIC (bridged recomendado) |

Compatible con: VMware ESXi/Workstation, VirtualBox, Proxmox VE, Hyper-V, KVM/QEMU.

## Compilar la ISO

### Requisitos
- Docker Desktop instalado y corriendo

### Linux/macOS
```bash
cd bcOS
chmod +x build.sh
./build.sh
```

### Windows (PowerShell)
```powershell
cd bcOS
.\build.ps1
```

La ISO se genera en `bcOS/output/bcOS-x86_64.iso`.

## Configuración

1. Bootea la ISO en tu VM.
2. Anota la IP asignada por DHCP (visible en la consola).
3. Abre `http://<IP-del-appliance>/` en el navegador.
4. Completa el wizard:
   - **URL de BCVision**: `https://tu-instancia.bcvision.io`
   - **API Key**: generada en BCVision → Ajustes → Agentes bcOS
5. Configura el Syslog de tus firewalls apuntando a la IP del appliance.

## Directorios en bcOS

| Ruta | Descripción |
|------|-------------|
| `/etc/bcvision/config.json` | Configuración del agente |
| `/etc/bcvision/brand-map.json` | Mapa IP → fabricante de firewall |
| `/opt/bcos-agent/` | Código del agente Node.js |
| `/var/log/bcos-agent.log` | Logs del agente |

## Configurar marca por IP (brand-map.json)

```json
{
  "192.168.1.1": "fortinet",
  "10.0.0.1": "cisco",
  "172.16.0.1": "pfsense"
}
```

Fabricantes soportados: `fortinet`, `cisco`, `pfsense`, `sophos`, `paloalto`, `mikrotik`, `generic`.
