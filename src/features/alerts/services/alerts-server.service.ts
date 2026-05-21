import { createClient } from '@/lib/supabase/server'
import type { AlertWithEvent, AlertStatus } from '@/shared/types/database'

export async function getAlerts(orgId: string, status?: AlertStatus, hours?: number): Promise<AlertWithEvent[]> {
  const supabase = await createClient()

  let query = supabase
    .from('alerts')
    .select(`
      *,
      firewall_event:firewall_events(event_type, src_ip, dst_ip, src_port, dst_port, severity, protocol, src_country, dst_country, user_name, application, bytes_sent, bytes_received, threat_name, threat_category, firewall_rule),
      device:devices(name, brand),
      user:users(full_name, email)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (hours) {
    const since = new Date(Date.now() - hours * 3_600_000).toISOString()
    query = query.gte('created_at', since)
  }

  if (status) query = query.eq('status', status)
  else query = query.in('status', ['open', 'acknowledged'])

  const { data } = await query
  return (data ?? []) as AlertWithEvent[]
}
