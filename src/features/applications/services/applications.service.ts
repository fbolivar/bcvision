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

const BLOCKED_ACTIONS = new Set(['deny', 'drop', 'block', 'blocked', 'reset'])

function isBlocked(action: string | null, pd: Record<string, unknown> | null): boolean {
  const effective = (action ?? (pd?.['action'] as string | undefined) ?? '').toLowerCase()
  return BLOCKED_ACTIONS.has(effective)
}

export async function getTopApplications(orgId: string, hours = 24, limit = 20): Promise<AppStat[]> {
  const supabase = await createClient()

  for (const lookback of [hours, Math.max(hours, 168)]) {
    const since = new Date(Date.now() - lookback * 3_600_000).toISOString()

    const { data } = await supabase
      .from('firewall_events')
      .select('application, bytes_sent, bytes_received, action, user_name, parsed_data')
      .eq('org_id', orgId)
      .gte('event_time', since)
      .not('application', 'is', null)
      .limit(10000)

    if (!data || data.length === 0) continue

    const map      = new Map<string, AppStat>()
    const appUsers = new Map<string, Set<string>>()

    for (const row of data) {
      const app   = row.application ?? 'unknown'
      const bytes = (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
      const pd    = row.parsed_data as Record<string, unknown> | null
      const blocked = isBlocked(row.action, pd) ? 1 : 0
      const existing = map.get(app)
      if (existing) {
        existing.session_count++
        existing.bytes_total  += bytes
        existing.blocked_count += blocked
      } else {
        map.set(app, { application: app, session_count: 1, bytes_total: bytes, blocked_count: blocked, user_count: 0 })
      }
      if (row.user_name) {
        if (!appUsers.has(app)) appUsers.set(app, new Set())
        appUsers.get(app)!.add(row.user_name)
      }
    }

    for (const [app, stat] of map) {
      stat.user_count = appUsers.get(app)?.size ?? 0
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.bytes_total - a.bytes_total)
      .slice(0, limit)

    if (result.length > 0) return result
  }

  return []
}

export async function getBlockedApplications(orgId: string, hours = 24): Promise<AppStat[]> {
  const supabase = await createClient()

  for (const lookback of [hours, Math.max(hours, 168)]) {
    const since = new Date(Date.now() - lookback * 3_600_000).toISOString()

    const { data } = await supabase
      .from('firewall_events')
      .select('application, bytes_sent, bytes_received, user_name, action, parsed_data')
      .eq('org_id', orgId)
      .gte('event_time', since)
      .not('application', 'is', null)
      .limit(10000)

    if (!data || data.length === 0) continue

    const map = new Map<string, AppStat>()
    for (const row of data) {
      const pd = row.parsed_data as Record<string, unknown> | null
      if (!isBlocked(row.action, pd)) continue
      const app   = row.application ?? 'unknown'
      const bytes = (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
      const existing = map.get(app)
      if (existing) {
        existing.session_count++
        existing.bytes_total  += bytes
        existing.blocked_count++
      } else {
        map.set(app, { application: app, session_count: 1, bytes_total: bytes, blocked_count: 1, user_count: 0 })
      }
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.session_count - a.session_count)
      .slice(0, 15)

    if (result.length > 0) return result
  }

  return []
}

export async function getTopProxyUsers(orgId: string, hours = 24): Promise<ProxyUser[]> {
  const supabase = await createClient()

  for (const lookback of [hours, Math.max(hours, 168)]) {
    const since = new Date(Date.now() - lookback * 3_600_000).toISOString()

    const { data } = await supabase
      .from('firewall_events')
      .select('user_name, bytes_sent, bytes_received, action, parsed_data')
      .eq('org_id', orgId)
      .gte('event_time', since)
      .not('user_name', 'is', null)
      .not('application', 'is', null)
      .limit(10000)

    if (!data || data.length === 0) continue

    const map = new Map<string, ProxyUser>()
    for (const row of data) {
      const user  = row.user_name ?? 'unknown'
      const bytes = (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
      const pd    = row.parsed_data as Record<string, unknown> | null
      const blocked = isBlocked(row.action, pd) ? 1 : 0
      const existing = map.get(user)
      if (existing) {
        existing.session_count++
        existing.bytes_total  += bytes
        existing.blocked_count += blocked
      } else {
        map.set(user, { user_name: user, session_count: 1, bytes_total: bytes, blocked_count: blocked })
      }
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.bytes_total - a.bytes_total)
      .slice(0, 15)

    if (result.length > 0) return result
  }

  return []
}

export async function getAppStats(orgId: string, hours = 24) {
  const supabase = await createClient()

  for (const lookback of [hours, Math.max(hours, 168)]) {
    const since = new Date(Date.now() - lookback * 3_600_000).toISOString()

    const { data } = await supabase
      .from('firewall_events')
      .select('application, action, bytes_sent, bytes_received, parsed_data')
      .eq('org_id', orgId)
      .gte('event_time', since)
      .not('application', 'is', null)
      .limit(10000)

    const rows = data ?? []
    if (rows.length === 0) continue

    const uniqueApps     = new Set(rows.map(r => r.application).filter(Boolean))
    const blockedSessions = rows.filter(r => {
      const pd = r.parsed_data as Record<string, unknown> | null
      return isBlocked(r.action, pd)
    }).length
    const bytesTotal = rows.reduce((s, r) => s + (r.bytes_sent ?? 0) + (r.bytes_received ?? 0), 0)

    return {
      total_applications: uniqueApps.size,
      total_sessions:     rows.length,
      blocked_sessions:   blockedSessions,
      bytes_total:        bytesTotal,
    }
  }

  return { total_applications: 0, total_sessions: 0, blocked_sessions: 0, bytes_total: 0 }
}
