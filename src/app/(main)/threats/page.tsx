import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { TimeFilter } from '@/shared/components/time-filter'
import { resolveHours } from '@/shared/lib/time'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { RecentEventsTable } from '@/features/dashboard/components/recent-events-table'
import { getThreatEvents, getThreatSummary } from '@/features/threats/services/threats.service'
import { Pagination } from '@/shared/components/pagination'
import type { Severity } from '@/shared/types/database'

export const dynamic = 'force-dynamic'
interface PageProps { searchParams: Promise<Record<string, string>> }

const SEVERITIES: { sev: Severity; label: string; color: string; glow: string }[] = [
  { sev: 'critical', label: 'Críticos',  color: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
  { sev: 'high',     label: 'Altos',     color: '#f97316', glow: 'rgba(249,115,22,0.2)' },
  { sev: 'medium',   label: 'Medios',    color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  { sev: 'low',      label: 'Bajos',     color: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
]

export default async function ThreatsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { hours, isLive, param, label } = resolveHours(sp['hours'], 24)
  const page     = parseInt(sp['page'] ?? '1', 10)
  const severity = sp['severity'] as Severity | undefined
  const PAGE_SIZE = 50

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = profile?.org_id ?? ''

  const [{ events, total }, summary] = await Promise.all([
    getThreatEvents(orgId, { hours, severity, page, pageSize: PAGE_SIZE }),
    getThreatSummary(orgId, hours),
  ])
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function severityHref(sev: Severity) {
    if (severity === sev) return '/threats'
    return `/threats?severity=${sev}`
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={isLive} />
      <Topbar title="Amenazas y bloqueos" subtitle={`${total.toLocaleString()} eventos · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#334155] font-medium">Período de análisis</span>
          <TimeFilter current={param} />
        </div>

        {/* Severity cards */}
        <div className="grid grid-cols-4 gap-3">
          {SEVERITIES.map(({ sev, label: sevLabel, color, glow }) => {
            const count  = summary.bySeverity[sev] ?? 0
            const active = severity === sev
            return (
              <a key={sev} href={severityHref(sev)}
                className="glass rounded-2xl p-5 border hover-card relative overflow-hidden transition-all"
                style={active ? { borderColor: color + '60', boxShadow: `0 0 24px ${glow}` } : {}}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full blur-xl opacity-20"
                  style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-30"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full animate-glow-pulse" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{sevLabel}</span>
                  </div>
                  <p className="text-3xl font-bold text-white tabular-nums">{count.toLocaleString()}</p>
                </div>
              </a>
            )
          })}
        </div>

        {/* Top threats */}
        {summary.topThreats.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#ef4444] to-[#dc2626]" />
              <h2 className="font-bold text-white text-sm">Top amenazas detectadas</h2>
            </div>
            <div className="p-5 space-y-3">
              {summary.topThreats.map(({ name, count }, i) => {
                const pct = total > 0 ? Math.round((count / total) * 100) || 1 : 1
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#334155] w-4">{i + 1}</span>
                    <span className="text-xs text-[#94a3b8] truncate flex-1">{name}</span>
                    <div className="w-32 bg-[#060a12] rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                    </div>
                    <span className="text-xs font-bold text-[#64748b] tabular-nums w-10 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Events table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0f2038]">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#f59e0b] to-[#d97706]" />
              <h2 className="font-bold text-white text-sm">Timeline de eventos</h2>
            </div>
            <span className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">
              Pág {page} · {total.toLocaleString()} total
            </span>
          </div>
          <div className="p-5"><RecentEventsTable events={events} /></div>
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-[#0f2038]">
              <Pagination page={page} totalPages={totalPages} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
