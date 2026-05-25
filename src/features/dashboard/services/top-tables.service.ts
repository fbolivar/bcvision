import { createClient } from '@/lib/supabase/server'

export interface UrlCategoryRow {
  category: string
  traffic: number
  sessions: number
  users: number
}

export interface UserIpRow {
  user_name: string
  src_ip: string
  application: string
  traffic: number
  sessions: number
}

const PORT_NAMES: Record<number, string> = {
  80: 'HTTP', 443: 'HTTPS', 53: 'DNS', 22: 'SSH', 21: 'FTP',
  25: 'SMTP', 110: 'POP3', 143: 'IMAP', 3389: 'RDP', 3306: 'MySQL',
  5432: 'PostgreSQL', 6379: 'Redis', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt',
  1194: 'OpenVPN', 500: 'IKE', 4500: 'NAT-T', 123: 'NTP', 161: 'SNMP',
  5060: 'SIP', 5061: 'SIPS', 27017: 'MongoDB',
}

const EVENT_LABELS: Record<string, string> = {
  traffic: 'Tráfico General', block: 'Contenido Bloqueado', threat: 'Amenazas',
  auth: 'Autenticación', vpn: 'VPN / Túneles', nat: 'NAT / Proxy', system: 'Sistema',
}

export async function getUrlCategoryTable(orgId: string, hours = 24): Promise<UrlCategoryRow[]> {
  const supabase = await createClient()

  // Try requested period first; fall back to 7 days if no webfilter data
  for (const lookbackHours of [hours, Math.max(hours, 168)]) {
    const since = new Date(Date.now() - lookbackHours * 3600_000).toISOString()

    const { data } = await supabase
      .from('firewall_events')
      .select('parsed_data, bytes_sent, bytes_received, user_name')
      .eq('org_id', orgId)
      .gte('event_time', since)
      .not('parsed_data', 'is', null)
      .limit(10000)

    const map = new Map<string, { traffic: number; sessions: number; users: Set<string> }>()

    for (const row of data ?? []) {
      const pd = row.parsed_data as Record<string, unknown> | null
      const catdesc = pd?.['catdesc'] as string | undefined
      if (!catdesc || catdesc === 'Unrated' || catdesc === 'Unknown') continue

      const existing = map.get(catdesc) ?? { traffic: 0, sessions: 0, users: new Set() }
      existing.traffic  += (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
      existing.sessions += 1
      if (row.user_name) existing.users.add(row.user_name)
      map.set(catdesc, existing)
    }

    if (map.size > 0) {
      return Array.from(map.entries())
        .map(([category, v]) => ({ category, traffic: v.traffic, sessions: v.sessions, users: v.users.size }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 8)
    }
  }

  return []
}

export async function getUserIpTable(orgId: string, hours = 24): Promise<UserIpRow[]> {
  const supabase = await createClient()

  // Try requested period first; fall back to 7 days if no identified users
  for (const lookbackHours of [hours, Math.max(hours, 168)]) {
    const since = new Date(Date.now() - lookbackHours * 3600_000).toISOString()

    const { data } = await supabase
      .from('firewall_events')
      .select('user_name, src_ip, application, dst_port, bytes_sent, bytes_received')
      .eq('org_id', orgId)
      .gte('event_time', since)
      .not('user_name', 'is', null)
      .limit(8000)

    if (!data || data.length === 0) continue

    const map = new Map<string, { user_name: string; src_ip: string; application: string; traffic: number; sessions: number }>()

    for (const row of data) {
      const user = row.user_name!
      const ip   = row.src_ip || 'N/A'
      const app  = row.application
        || (row.dst_port ? PORT_NAMES[Number(row.dst_port)] ?? `Puerto ${row.dst_port}` : 'N/A')

      // Group by user + most common IP (use user as key, track latest IP)
      const existing = map.get(user) ?? { user_name: user, src_ip: ip, application: app, traffic: 0, sessions: 0 }
      existing.traffic  += (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
      existing.sessions += 1
      // Keep most common src_ip (overwrite — last wins; good enough for display)
      existing.src_ip = ip
      map.set(user, existing)
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)

    if (result.length > 0) return result
  }

  return []
}
