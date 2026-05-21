import { createClient } from '@/lib/supabase/client'
import type { AlertWithEvent, AlertStatus } from '@/shared/types/database'

export async function getAlerts(orgId: string, status?: AlertStatus): Promise<AlertWithEvent[]> {
  const supabase = createClient()

  let query = supabase
    .from('alerts')
    .select(`
      *,
      firewall_event:firewall_events(event_type, src_ip, dst_ip, severity),
      device:devices(name, brand),
      user:users(full_name, email)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  else query = query.in('status', ['open', 'acknowledged'])

  const { data } = await query
  return (data ?? []) as AlertWithEvent[]
}

export async function updateAlertStatus(alertId: string, status: AlertStatus, notes?: string) {
  const supabase = createClient()
  const updates: Record<string, unknown> = { status }
  if (status === 'acknowledged') updates['acknowledged_at'] = new Date().toISOString()
  if (status === 'resolved' || status === 'false_positive') updates['resolved_at'] = new Date().toISOString()
  if (notes) updates['notes'] = notes
  return supabase.from('alerts').update(updates).eq('id', alertId)
}
