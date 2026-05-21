import { createClient } from '@/lib/supabase/server'

export interface UserActivity {
  user_name: string
  event_count: number
  bytes_total: number
  blocked_count: number
  last_seen: string
  top_url: string | null
}

export interface IpActivity {
  src_ip: string
  event_count: number
  bytes_total: number
  blocked_count: number
  last_seen: string
}

export async function getUserActivity(orgId: string, hours = 24): Promise<UserActivity[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('user_name, bytes_sent, bytes_received, action, event_time, url')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('user_name', 'is', null)
    .order('event_time', { ascending: false })

  const userMap: Record<string, UserActivity> = {}

  for (const row of data ?? []) {
    const name = row.user_name!
    if (!userMap[name]) {
      userMap[name] = {
        user_name: name,
        event_count: 0,
        bytes_total: 0,
        blocked_count: 0,
        last_seen: row.event_time,
        top_url: null,
      }
    }
    const u = userMap[name]
    u.event_count++
    u.bytes_total += (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
    if (row.action === 'deny' || row.action === 'drop') u.blocked_count++
    if (!u.top_url && row.url) u.top_url = row.url
  }

  return Object.values(userMap).sort((a, b) => b.bytes_total - a.bytes_total)
}

export async function getTopSourceIps(orgId: string, hours = 24, limit = 20): Promise<IpActivity[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('src_ip, bytes_sent, bytes_received, action, event_time')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('src_ip', 'is', null)
    .order('event_time', { ascending: false })

  const ipMap: Record<string, IpActivity> = {}

  for (const row of data ?? []) {
    const ip = row.src_ip!
    if (!ipMap[ip]) {
      ipMap[ip] = { src_ip: ip, event_count: 0, bytes_total: 0, blocked_count: 0, last_seen: row.event_time }
    }
    const entry = ipMap[ip]
    entry.event_count++
    entry.bytes_total += (row.bytes_sent ?? 0) + (row.bytes_received ?? 0)
    if (row.action === 'deny' || row.action === 'drop') entry.blocked_count++
  }

  return Object.values(ipMap)
    .sort((a, b) => b.event_count - a.event_count)
    .slice(0, limit)
}
