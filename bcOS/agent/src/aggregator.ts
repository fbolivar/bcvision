import {
  getPendingAlerts, markAlertsSynced,
  getPendingStats,  markStatsSynced,
} from './storage'
import type { AgentConfig } from './types'

// ── Send pending alerts immediately ────────────────────────────
export async function syncAlerts(cfg: AgentConfig): Promise<void> {
  const alerts = getPendingAlerts() as Record<string, unknown>[]
  if (!alerts.length) return

  try {
    const res = await fetch(`${cfg.bcvision_url}/api/agent/alerts`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${cfg.bcvision_api_key}`,
      },
      body: JSON.stringify({ alerts, agent_name: cfg.agent_name }),
      signal: AbortSignal.timeout(10_000),
    })

    if (res.ok) {
      const ids = alerts.map(a => a.queue_id as number)
      markAlertsSynced(ids)
      console.log(`[bcOS] ✓ ${alerts.length} alertas enviadas a BCVision`)
    }
  } catch (err) {
    console.warn(`[bcOS] No se pudo enviar alertas: ${(err as Error).message}`)
  }
}

// ── Send aggregated stats every interval ────────────────────────
export async function syncStats(cfg: AgentConfig): Promise<void> {
  const stats = getPendingStats() as Record<string, unknown>[]
  if (!stats.length) return

  try {
    const res = await fetch(`${cfg.bcvision_url}/api/agent/stats`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${cfg.bcvision_api_key}`,
      },
      body: JSON.stringify({ stats, agent_name: cfg.agent_name }),
      signal: AbortSignal.timeout(10_000),
    })

    if (res.ok) {
      const ids = stats.map(s => s.id as number)
      markStatsSynced(ids)
      console.log(`[bcOS] ✓ ${stats.length} buckets de stats sincronizados`)
    }
  } catch (err) {
    console.warn(`[bcOS] No se pudo sincronizar stats: ${(err as Error).message}`)
  }
}

// ── Start sync loops ─────────────────────────────────────────────
export function startSyncLoop(cfg: AgentConfig): void {
  // Alerts: check every 30 seconds
  setInterval(() => syncAlerts(cfg).catch(() => {}), 30_000)

  // Stats: sync every 5 minutes
  setInterval(() => syncStats(cfg).catch(() => {}), 5 * 60_000)

  // Initial sync after 10 seconds
  setTimeout(() => {
    syncAlerts(cfg).catch(() => {})
    syncStats(cfg).catch(() => {})
  }, 10_000)
}
