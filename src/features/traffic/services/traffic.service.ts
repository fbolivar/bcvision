import { createClient } from '@/lib/supabase/server'
import type { FirewallEventWithDevice } from '@/shared/types/database'

export interface TrafficFilters {
  from?: string
  to?: string
  protocol?: string
  action?: string
  srcIp?: string
  dstIp?: string
  severity?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function getTrafficEvents(orgId: string, filters: TrafficFilters = {}) {
  const supabase = await createClient()
  const { from, to, protocol, action, srcIp, dstIp, severity, search, page = 1, pageSize = 50 } = filters
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('firewall_events')
    .select(`*, device:devices(name, brand, ip_address)`, { count: 'exact' })
    .eq('org_id', orgId)
    .order('event_time', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (from)     query = query.gte('event_time', from)
  if (to)       query = query.lte('event_time', to)
  if (protocol) query = query.ilike('protocol', `%${protocol}%`)
  if (action)   query = query.eq('action', action)
  // src_ip_text / dst_ip_text son columnas generadas (inet::text) — soportan ILIKE
  if (srcIp)    query = query.ilike('src_ip_text', `%${srcIp}%`)
  if (dstIp)    query = query.ilike('dst_ip_text', `%${dstIp}%`)
  if (severity) query = query.eq('severity', severity)
  if (search)   query = query.or(`src_ip_text.ilike.%${search}%,dst_ip_text.ilike.%${search}%,protocol.ilike.%${search}%,user_name.ilike.%${search}%,application.ilike.%${search}%`)

  const { data, count, error } = await query

  return {
    events: (data ?? []) as FirewallEventWithDevice[],
    total: count ?? 0,
    error,
  }
}

export async function getProtocolBreakdown(orgId: string, hours = 24) {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('protocol')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('protocol', 'is', null)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const p = row.protocol ?? 'unknown'
    counts[p] = (counts[p] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([protocol, count]) => ({ protocol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}
