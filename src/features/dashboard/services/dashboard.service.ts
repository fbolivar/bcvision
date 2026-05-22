import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, FirewallEventWithDevice } from '@/shared/types/database'

export async function getDashboardStats(orgId: string, hours = 24): Promise<DashboardStats> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()

  const [eventsRes, blockedRes, threatsRes, devicesRes, alertsRes, bytesRes] = await Promise.all([
    supabase
      .from('firewall_events')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('event_time', since),
    supabase
      .from('firewall_events')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('action', ['deny', 'drop'])
      .gte('event_time', since),
    supabase
      .from('firewall_events')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('event_type', 'threat')
      .gte('event_time', since),
    supabase
      .from('devices')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('active', true),
    supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('severity', 'critical')
      .eq('status', 'open'),
    supabase
      .from('firewall_events')
      .select('bytes_sent, bytes_received')
      .eq('org_id', orgId)
      .gte('event_time', since)
      .limit(5000),
  ])

  const bytesTotal = (bytesRes.data ?? []).reduce(
    (acc, e) => acc + (e.bytes_sent ?? 0) + (e.bytes_received ?? 0), 0
  )

  return {
    total_events_24h:    eventsRes.count ?? 0,
    blocked_events_24h:  blockedRes.count ?? 0,
    threats_24h:         threatsRes.count ?? 0,
    active_devices:      devicesRes.count ?? 0,
    critical_alerts:     alertsRes.count ?? 0,
    bytes_total_24h:     bytesTotal,
  }
}

export async function getRecentEvents(orgId: string, limit = 50): Promise<FirewallEventWithDevice[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('firewall_events')
    .select(`*, device:devices(name, brand, ip_address)`)
    .eq('org_id', orgId)
    .order('event_time', { ascending: false })
    .limit(limit)

  return (data ?? []) as FirewallEventWithDevice[]
}
