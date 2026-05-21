export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/shared/components/topbar'
import { MsspDashboard } from '@/features/mssp/components/mssp-dashboard'
import { EmailConfigWidget } from '@/features/mssp/components/email-config-widget'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role, org_id').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Obtener todas las organizaciones con métricas básicas
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, plan, max_devices, monthly_price, tax_id_type, tax_id, created_at')
    .order('created_at', { ascending: false })

  const orgIds = (orgs ?? []).map(o => o.id)

  // Métricas de las últimas 24h por org
  const since24h = new Date(Date.now() - 24 * 3600000).toISOString()
  const { data: events24h } = await supabase
    .from('firewall_events')
    .select('org_id, action, severity')
    .in('org_id', orgIds)
    .gte('event_time', since24h)

  const { data: openAlerts } = await supabase
    .from('alerts')
    .select('org_id, severity')
    .in('org_id', orgIds)
    .eq('status', 'open')

  const { data: memberCounts } = await supabase
    .from('users')
    .select('org_id')
    .in('org_id', orgIds)

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('org_id, status, current_period_end')
    .in('org_id', orgIds)

  // Agregar por org
  const orgStats: Record<string, { events: number; threats: number; alerts: number; members: number }> = {}
  for (const id of orgIds) orgStats[id] = { events: 0, threats: 0, alerts: 0, members: 0 }
  for (const e of (events24h ?? [])) {
    if (!orgStats[e.org_id]) continue
    orgStats[e.org_id].events++
    if (['critical','high'].includes(e.severity)) orgStats[e.org_id].threats++
  }
  for (const a of (openAlerts ?? [])) {
    if (orgStats[a.org_id]) orgStats[a.org_id].alerts++
  }
  for (const m of (memberCounts ?? [])) {
    if (orgStats[m.org_id]) orgStats[m.org_id].members++
  }

  const subByOrg: Record<string, { status: string; current_period_end: string | null }> = {}
  for (const s of (subscriptions ?? [])) subByOrg[s.org_id] = s

  const orgsWithStats = (orgs ?? []).map(o => ({
    ...o,
    stats: orgStats[o.id] ?? { events: 0, threats: 0, alerts: 0, members: 0 },
    subscription: subByOrg[o.id] ?? null,
  }))

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Panel MSSP" subtitle={`${orgs?.length ?? 0} organizaciones gestionadas`} />
      <div className="flex-1 p-6 overflow-y-auto mesh-bg">
        <MsspDashboard orgs={orgsWithStats} />
        <div className="max-w-6xl mx-auto mt-5">
          <EmailConfigWidget />
        </div>
      </div>
    </div>
  )
}
