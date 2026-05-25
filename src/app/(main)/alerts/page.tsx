import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { TimeFilter } from '@/shared/components/time-filter'
import { resolveHours } from '@/shared/lib/time'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { AlertCard } from '@/features/alerts/components/alert-card'
import { getAlerts } from '@/features/alerts/services/alerts-server.service'
import type { AlertStatus } from '@/shared/types/database'
import { Bell, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'
interface PageProps { searchParams: Promise<Record<string, string>> }

const STATUS_TABS: { value: AlertStatus | 'all'; label: string; color: string }[] = [
  { value: 'all',          label: 'Todas',       color: '#64748b' },
  { value: 'open',         label: 'Abiertas',    color: '#ef4444' },
  { value: 'acknowledged', label: 'Reconocidas', color: '#f59e0b' },
  { value: 'resolved',     label: 'Resueltas',   color: '#22c55e' },
]

export default async function AlertsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { hours, isLive, param, label } = resolveHours(sp['hours'], 24)
  const status = sp['status'] as AlertStatus | undefined

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase.from('users').select('org_id, role').eq('id', user!.id).single()
  const orgId      = profile?.org_id ?? ''
  const canAction  = ['admin', 'analyst'].includes(profile?.role ?? '')
  const alerts     = await getAlerts(orgId, status, hours)
  const critical = alerts.filter(a => a.severity === 'critical').length
  const high     = alerts.filter(a => a.severity === 'high').length

  function tabHref(value: AlertStatus | 'all') {
    if (value === 'all') return '/alerts'
    return `/alerts?status=${value}`
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={isLive} />
      <Topbar title="Alertas de seguridad" subtitle={`${alerts.length} alerta${alerts.length !== 1 ? 's' : ''} · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#334155] font-medium">Período de análisis</span>
          <TimeFilter current={param} />
        </div>

        {/* Critical banner */}
        {(critical > 0 || high > 0) && (
          <div className="flex items-center gap-3 bg-[#ef4444]/10 border border-[#ef4444]/25 rounded-2xl px-5 py-4 animate-fade-in"
            style={{ boxShadow: '0 0 30px rgba(239,68,68,0.1)' }}>
            <div className="w-8 h-8 rounded-xl bg-[#ef4444]/15 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4 text-[#f87171] animate-glow-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f87171]">Atención inmediata requerida</p>
              <p className="text-xs text-[#ef4444]/70 mt-0.5">
                {critical > 0 && <span><strong className="text-[#f87171]">{critical}</strong> crítica{critical !== 1 ? 's' : ''} · </span>}
                {high > 0 && <span><strong className="text-[#fb923c]">{high}</strong> alta{high !== 1 ? 's' : ''} </span>}
                sin resolver
              </p>
            </div>
          </div>
        )}

        {/* Filters row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status tabs */}
          <div className="flex gap-1 glass rounded-xl p-1 w-fit">
            {STATUS_TABS.map(tab => {
              const active = tab.value === 'all' ? !status : status === tab.value
              return (
                <a key={tab.value} href={tabHref(tab.value)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all relative"
                  style={active ? {
                    background: `${tab.color}15`,
                    color: tab.color,
                    boxShadow: `0 0 12px ${tab.color}25`,
                    borderLeft: `2px solid ${tab.color}`,
                  } : { color: '#334155' }}>
                  {tab.label}
                </a>
              )
            })}
          </div>

        </div>

        {/* Alerts list */}
        {alerts.length === 0 ? (
          <div className="glass rounded-2xl p-14 text-center">
            <div className="w-14 h-14 rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/8 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-[#22c55e]/60" />
            </div>
            <p className="text-[#64748b] font-semibold text-sm">Sin alertas activas</p>
            <p className="text-[#334155] text-xs mt-1 max-w-sm mx-auto">
              El sistema generará alertas automáticamente cuando detecte amenazas o comportamientos anómalos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => <AlertCard key={alert.id} alert={alert} canAction={canAction} />)}
          </div>
        )}
      </div>
    </div>
  )
}
