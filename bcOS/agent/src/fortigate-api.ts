import type { AgentConfig } from './types'

export interface FgVpnSession {
  user_name:    string
  remote_ip:    string
  tunnel_ip:    string
  duration_sec: number
  bytes_tx:     number
  bytes_rx:     number
  os_name:      string
  tunnel_type:  string
}

// FortiGate devuelve certs auto-firmados — deshabilitar verificación solo para la API interna
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export async function fetchActiveIpsecVpnSessions(cfg: AgentConfig): Promise<FgVpnSession[]> {
  if (!cfg.fortigate_ip || !cfg.fortigate_api_token) return []

  const url = `https://${cfg.fortigate_ip}/api/v2/monitor/vpn/ipsec`

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${cfg.fortigate_api_token}`,
      'Accept-Encoding': 'identity',
    },
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) throw new Error(`FortiGate API HTTP ${res.status}`)

  const data = await res.json() as { results?: Record<string, unknown>[] }
  const results = data.results ?? []

  const nowSec = Math.floor(Date.now() / 1000)

  return results
    .filter(r => r['type'] === 'dialup' || r['username'] || r['user'])
    .map(r => {
      const createdAt = Number(r['creation_time'] ?? r['created'] ?? 0)
      return {
        user_name:    String(r['username'] ?? r['user'] ?? r['name'] ?? ''),
        remote_ip:    String(r['rgwy'] ?? r['remote_gateway'] ?? r['remip'] ?? ''),
        tunnel_ip:    String(r['tun_ip'] ?? r['tunnel_ip'] ?? ''),
        duration_sec: createdAt > 0 ? Math.max(0, nowSec - createdAt) : 0,
        bytes_tx:     Number(r['outgoing_bytes'] ?? r['bytes_tx'] ?? 0),
        bytes_rx:     Number(r['incoming_bytes']  ?? r['bytes_rx'] ?? 0),
        os_name:      '',
        tunnel_type:  'ipsec',
      }
    })
    .filter(s => s.user_name)
}

export async function pushVpnSessionsToBcvision(
  cfg: AgentConfig,
  sessions: FgVpnSession[]
): Promise<void> {
  const res = await fetch(`${cfg.bcvision_url}/api/agent/vpn-sessions`, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'Authorization':   `Bearer ${cfg.bcvision_api_key}`,
      'Accept-Encoding': 'identity',
    },
    body: JSON.stringify({ sessions, agent_name: cfg.agent_name }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`BCVision vpn-sessions HTTP ${res.status}`)
}

export function startFortigatePoller(cfg: AgentConfig): void {
  async function poll() {
    try {
      const sessions = await fetchActiveIpsecVpnSessions(cfg)
      await pushVpnSessionsToBcvision(cfg, sessions)
      console.log(`[bcOS] VPN IPsec: ${sessions.length} sesiones activas enviadas a BCVision`)
    } catch (err) {
      console.warn(`[bcOS] FortiGate API error: ${(err as Error).message}`)
    }
  }

  // Primera consulta a los 5 segundos, luego cada 60 segundos
  setTimeout(() => {
    poll()
    setInterval(poll, 60_000)
  }, 5_000)
}
