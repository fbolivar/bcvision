import { createClient } from '@/lib/supabase/server'

export interface VpnUser {
  user_name: string
  session_count: number
  bytes_total: number
  failed_logins: number
  last_ip: string | null
  last_seen: string
}

export interface VpnSession {
  event_time: string
  user_name: string | null
  src_ip: string | null
  action: string | null
  bytes_sent: number
  bytes_received: number
  duration_ms: number | null
}

export interface VpnStats {
  total_sessions: number
  active_users: number
  failed_logins: number
  bytes_total: number
}

export async function getVpnStats(orgId: string, hours = 24): Promise<VpnStats> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('action, user_name, bytes_sent, bytes_received')
    .eq('org_id', orgId)
    .eq('event_type', 'vpn')
    .gte('event_time', since)

  const rows = data ?? []
  const uniqueUsers = new Set(rows.filter(r => r.action !== 'deny' && r.action !== 'drop').map(r => r.user_name).filter(Boolean))
  const failedLogins = rows.filter(r => r.action === 'deny' || r.action === 'drop').length
  const bytesTotal = rows.reduce((s, r) => s + (r.bytes_sent ?? 0) + (r.bytes_received ?? 0), 0)

  return {
    total_sessions: rows.filter(r => r.action !== 'deny' && r.action !== 'drop').length,
    active_users: uniqueUsers.size,
    failed_logins: failedLogins,
    bytes_total: bytesTotal,
  }
}

export async function getVpnUsers(orgId: string, hours = 24): Promise<VpnUser[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('user_name, src_ip, action, bytes_sent, bytes_received, event_time')
    .eq('org_id', orgId)
    .eq('event_type', 'vpn')
    .gte('event_time', since)
    .order('event_time', { ascending: false })

  const map = new Map<string, VpnUser>()
  for (const row of (data ?? []).filter(r => r.action !== 'deny' && r.action !== 'drop' && r.action !== null || (r.action === null && !!r.user_name))) {
    const key = row.user_name ?? row.src_ip ?? 'Desconocido'
    const existing = map.get(key)
    const bytes = (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
    const failed = (row.action === 'deny' || row.action === 'drop') ? 1 : 0
    if (existing) {
      existing.session_count++
      existing.bytes_total += bytes
      existing.failed_logins += failed
    } else {
      map.set(key, {
        user_name: key,
        session_count: 1,
        bytes_total: bytes,
        failed_logins: failed,
        last_ip: row.src_ip,
        last_seen: row.event_time,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.bytes_total - a.bytes_total)
}

export async function getVpnSessions(orgId: string, hours = 24, limit = 50): Promise<VpnSession[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('event_time, user_name, src_ip, action, bytes_sent, bytes_received, duration_ms')
    .eq('org_id', orgId)
    .eq('event_type', 'vpn')
    .gte('event_time', since)
    .order('event_time', { ascending: false })
    .limit(limit)

  return (data ?? []) as VpnSession[]
}

export async function getVpnFailedLogins(orgId: string, hours = 24): Promise<{ src_ip: string; count: number }[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('src_ip')
    .eq('org_id', orgId)
    .eq('event_type', 'vpn')
    .in('action', ['deny', 'drop'])
    .gte('event_time', since)
    .not('src_ip', 'is', null)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const ip = row.src_ip ?? 'unknown'
    counts[ip] = (counts[ip] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([src_ip, count]) => ({ src_ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}
