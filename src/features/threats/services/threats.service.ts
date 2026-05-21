import { createClient } from '@/lib/supabase/server'
import type { FirewallEventWithDevice, Severity } from '@/shared/types/database'

export async function getThreatEvents(
  orgId: string,
  options: { hours?: number; severity?: Severity; page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient()
  const { hours = 24, severity, page = 1, pageSize = 50 } = options
  const since  = new Date(Date.now() - hours * 3600_000).toISOString()
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('firewall_events')
    .select(`*, device:devices(name, brand, ip_address)`, { count: 'exact' })
    .eq('org_id', orgId)
    .in('event_type', ['threat', 'block'])
    .gte('event_time', since)
    .order('event_time', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (severity) query = query.eq('severity', severity)

  const { data, count } = await query
  return {
    events: (data ?? []) as FirewallEventWithDevice[],
    total:  count ?? 0,
  }
}

export async function getThreatSummary(orgId: string, hours = 24) {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('severity, threat_category, threat_name')
    .eq('org_id', orgId)
    .in('event_type', ['threat', 'block'])
    .gte('event_time', since)
    .not('threat_name', 'is', null)

  const byCategory: Record<string, number> = {}
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  const topThreats: Record<string, number> = {}

  for (const row of data ?? []) {
    const cat = row.threat_category ?? 'other'
    byCategory[cat] = (byCategory[cat] ?? 0) + 1
    bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1
    if (row.threat_name) {
      topThreats[row.threat_name] = (topThreats[row.threat_name] ?? 0) + 1
    }
  }

  const topThreatsList = Object.entries(topThreats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return { byCategory, bySeverity, topThreats: topThreatsList }
}
