import { createClient } from '@/lib/supabase/server'

export interface AppStat {
  application: string
  session_count: number
  bytes_total: number
  blocked_count: number
  user_count: number
}

export interface AppCategoryStat {
  category: string
  session_count: number
  bytes_total: number
  blocked_count: number
}

export interface ProxyUser {
  user_name: string
  session_count: number
  bytes_total: number
  blocked_count: number
}

export async function getTopApplications(orgId: string, hours = 24, limit = 20): Promise<AppStat[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('application, bytes_sent, bytes_received, action, user_name')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('application', 'is', null)

  const map = new Map<string, AppStat>()
  for (const row of data ?? []) {
    const app = row.application ?? 'unknown'
    const bytes = (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
    const blocked = (row.action === 'deny' || row.action === 'drop') ? 1 : 0
    const existing = map.get(app)
    if (existing) {
      existing.session_count++
      existing.bytes_total += bytes
      existing.blocked_count += blocked
      if (row.user_name) existing.user_count++
    } else {
      map.set(app, { application: app, session_count: 1, bytes_total: bytes, blocked_count: blocked, user_count: row.user_name ? 1 : 0 })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.bytes_total - a.bytes_total)
    .slice(0, limit)
}

export async function getBlockedApplications(orgId: string, hours = 24): Promise<AppStat[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('application, bytes_sent, bytes_received, user_name')
    .eq('org_id', orgId)
    .in('action', ['deny', 'drop'])
    .gte('event_time', since)
    .not('application', 'is', null)

  const map = new Map<string, AppStat>()
  for (const row of data ?? []) {
    const app = row.application ?? 'unknown'
    const bytes = (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
    const existing = map.get(app)
    if (existing) {
      existing.session_count++
      existing.bytes_total += bytes
      existing.blocked_count++
    } else {
      map.set(app, { application: app, session_count: 1, bytes_total: bytes, blocked_count: 1, user_count: 0 })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.session_count - a.session_count)
    .slice(0, 15)
}

export async function getTopProxyUsers(orgId: string, hours = 24): Promise<ProxyUser[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('user_name, bytes_sent, bytes_received, action')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('user_name', 'is', null)
    .not('application', 'is', null)

  const map = new Map<string, ProxyUser>()
  for (const row of data ?? []) {
    const user = row.user_name ?? 'unknown'
    const bytes = (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
    const blocked = (row.action === 'deny' || row.action === 'drop') ? 1 : 0
    const existing = map.get(user)
    if (existing) {
      existing.session_count++
      existing.bytes_total += bytes
      existing.blocked_count += blocked
    } else {
      map.set(user, { user_name: user, session_count: 1, bytes_total: bytes, blocked_count: blocked })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.bytes_total - a.bytes_total)
    .slice(0, 15)
}

export async function getAppStats(orgId: string, hours = 24) {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('application, action, bytes_sent, bytes_received')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('application', 'is', null)

  const rows = data ?? []
  const uniqueApps = new Set(rows.map(r => r.application).filter(Boolean))
  const blockedSessions = rows.filter(r => r.action === 'deny' || r.action === 'drop').length
  const bytesTotal = rows.reduce((s, r) => s + (r.bytes_sent ?? 0) + (r.bytes_received ?? 0), 0)

  return {
    total_applications: uniqueApps.size,
    total_sessions: rows.length,
    blocked_sessions: blockedSessions,
    bytes_total: bytesTotal,
  }
}
