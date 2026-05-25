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

export interface VpnActiveSession {
  user_name:    string
  remote_ip:    string | null
  tunnel_ip:    string | null
  duration_sec: number
  bytes_tx:     number
  bytes_rx:     number
  os_name:      string | null
  tunnel_type:  string
  last_seen:    string
}

export async function getVpnActiveSessions(orgId: string): Promise<VpnActiveSession[]> {
  const supabase = await createClient()
  // Sesiones reportadas en los últimos 3 minutos = activas ahora
  const since = new Date(Date.now() - 3 * 60_000).toISOString()
  const { data } = await supabase
    .from('vpn_active_sessions')
    .select('user_name, remote_ip, tunnel_ip, duration_sec, bytes_tx, bytes_rx, os_name, tunnel_type, last_seen')
    .eq('org_id', orgId)
    .gte('last_seen', since)
    .order('bytes_tx', { ascending: false })
  return (data ?? []) as VpnActiveSession[]
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

export interface VpnMigrationUser {
  user_name: string
  ssl_sessions: number
  ipsec_sessions: number
  status: 'ssl_only' | 'ipsec_only' | 'migrating' | 'unknown'
  last_ssl: string | null
  last_ipsec: string | null
}

export interface VpnMigrationSummary {
  ssl_users: number
  ipsec_users: number
  migrating_users: number
  ssl_sessions: number
  ipsec_sessions: number
}

export async function getVpnMigrationStatus(orgId: string, days = 30): Promise<{
  summary: VpnMigrationSummary
  users: VpnMigrationUser[]
}> {
  const supabase = await createClient()
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('user_name, event_time, parsed_data')
    .eq('org_id', orgId)
    .eq('event_type', 'vpn')
    .gte('event_time', since)
    .not('user_name', 'is', null)
    .neq('user_name', 'N/A')

  const map = new Map<string, VpnMigrationUser>()

  for (const row of (data ?? [])) {
    const userName = row.user_name as string
    const tunnelType = (row.parsed_data as Record<string, unknown>)?.tunneltype as string | null
    const eventTime = row.event_time as string

    if (!map.has(userName)) {
      map.set(userName, {
        user_name: userName,
        ssl_sessions: 0,
        ipsec_sessions: 0,
        status: 'unknown',
        last_ssl: null,
        last_ipsec: null,
      })
    }

    const user = map.get(userName)!
    if (tunnelType === 'ssl') {
      user.ssl_sessions++
      if (!user.last_ssl || eventTime > user.last_ssl) user.last_ssl = eventTime
    } else if (tunnelType === 'ipsec') {
      user.ipsec_sessions++
      if (!user.last_ipsec || eventTime > user.last_ipsec) user.last_ipsec = eventTime
    }
  }

  for (const user of map.values()) {
    if (user.ssl_sessions > 0 && user.ipsec_sessions > 0) user.status = 'migrating'
    else if (user.ipsec_sessions > 0) user.status = 'ipsec_only'
    else if (user.ssl_sessions > 0) user.status = 'ssl_only'
  }

  const users = Array.from(map.values())
    .sort((a, b) => (b.ipsec_sessions + b.ssl_sessions) - (a.ipsec_sessions + a.ssl_sessions))

  const summary: VpnMigrationSummary = {
    ssl_users:      users.filter(u => u.status === 'ssl_only').length,
    ipsec_users:    users.filter(u => u.status === 'ipsec_only').length,
    migrating_users:users.filter(u => u.status === 'migrating').length,
    ssl_sessions:   users.reduce((s, u) => s + u.ssl_sessions, 0),
    ipsec_sessions: users.reduce((s, u) => s + u.ipsec_sessions, 0),
  }

  return { summary, users }
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
