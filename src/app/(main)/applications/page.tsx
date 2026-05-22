import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { getAppStats, getTopApplications, getBlockedApplications, getTopProxyUsers } from '@/features/applications/services/applications.service'
import { formatBytes, formatNumber } from '@/shared/lib/utils'
import { AppWindow, Ban, Users, Database, ShieldX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const hours = 24
  const label = 'últimas 24h'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = profile?.org_id ?? ''

  const [stats, topApps, blockedApps, proxyUsers] = await Promise.all([
    getAppStats(orgId, hours),
    getTopApplications(orgId, hours, 20),
    getBlockedApplications(orgId, hours),
    getTopProxyUsers(orgId, hours),
  ])

  const statCards = [
    { label: 'Aplicaciones detectadas', value: formatNumber(stats.total_applications), icon: AppWindow, color: '#3b82f6' },
    { label: 'Sesiones totales',         value: formatNumber(stats.total_sessions),     icon: Database,  color: '#06b6d4' },
    { label: 'Sesiones bloqueadas',      value: formatNumber(stats.blocked_sessions),   icon: Ban,       color: '#ef4444' },
    { label: 'Datos transferidos',       value: formatBytes(stats.bytes_total),         icon: Database,  color: '#22c55e' },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={false} />
      <Topbar title="Control de Aplicaciones" subtitle={`${stats.total_applications} apps detectadas · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(({ label: lbl, value, icon: Icon, color }) => (
            <div key={lbl} className="glass rounded-2xl p-5 relative overflow-hidden hover-card">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full blur-xl opacity-20"
                style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
              <p className="text-[10px] text-[#475569] uppercase tracking-wider mt-1 font-medium">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Top apps by bandwidth */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#3b82f6] to-[#2563eb]" />
            <AppWindow className="w-4 h-4 text-[#60a5fa]" />
            <h2 className="font-bold text-white text-sm">Top aplicaciones por consumo</h2>
            <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{topApps.length} apps</span>
          </div>
          {topApps.length === 0 ? (
            <div className="p-10 text-center">
              <AppWindow className="w-8 h-8 text-[#1e3a5f] mx-auto mb-3" />
              <p className="text-xs text-[#334155]">Sin datos de aplicaciones en el período seleccionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#0a1628]">
                    {['#', 'Aplicación', 'Sesiones', 'Datos', 'Bloqueadas', 'Usuarios'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topApps.map((app, i) => {
                    const maxBytes = topApps[0]?.bytes_total ?? 1
                    const pct = Math.round((app.bytes_total / maxBytes) * 100)
                    return (
                      <tr key={app.application} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                        <td className="px-5 py-2.5 text-[10px] font-bold text-[#1e3a5f] w-8">{i + 1}</td>
                        <td className="px-5 py-2.5">
                          <div>
                            <div className="text-[#94a3b8] font-medium group-hover:text-white transition-colors">{app.application}</div>
                            <div className="mt-1 w-24 bg-[#060a12] rounded-full h-1 overflow-hidden">
                              <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[#475569] tabular-nums font-mono">{formatNumber(app.session_count)}</td>
                        <td className="px-5 py-2.5 text-[#475569]">{formatBytes(app.bytes_total)}</td>
                        <td className="px-5 py-2.5">
                          {app.blocked_count > 0
                            ? <span className="flex items-center gap-1 text-[#f87171] font-bold"><ShieldX className="w-3 h-3" />{app.blocked_count}</span>
                            : <span className="text-[#1e3a5f]">—</span>}
                        </td>
                        <td className="px-5 py-2.5 text-[#475569] tabular-nums">{app.user_count > 0 ? app.user_count : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Blocked Applications */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#ef4444] to-[#dc2626]" />
              <Ban className="w-4 h-4 text-[#f87171]" />
              <h2 className="font-bold text-white text-sm">Aplicaciones bloqueadas</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{blockedApps.length} apps</span>
            </div>
            {blockedApps.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#334155]">Sin bloqueos en el período</div>
            ) : (
              <div className="p-5 space-y-2">
                {blockedApps.map(({ application, session_count }, i) => {
                  const maxCount = blockedApps[0]?.session_count ?? 1
                  const pct = Math.round((session_count / maxCount) * 100)
                  return (
                    <div key={application} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#1e3a5f] w-4 tabular-nums">{i + 1}</span>
                      <span className="text-[#f87171] text-xs flex-1 truncate">{application}</span>
                      <div className="w-24 bg-[#060a12] rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                      </div>
                      <span className="text-xs font-bold text-[#ef4444] tabular-nums w-10 text-right">{session_count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Proxy Users */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed]" />
              <Users className="w-4 h-4 text-[#a78bfa]" />
              <h2 className="font-bold text-white text-sm">Usuarios por consumo de apps</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{proxyUsers.length} usuarios</span>
            </div>
            {proxyUsers.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#334155]">Sin usuarios identificados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#0a1628]">
                      {['Usuario', 'Sesiones', 'Datos', 'Bloqueadas'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proxyUsers.map(u => (
                      <tr key={u.user_name} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/25 flex items-center justify-center text-[9px] font-bold text-[#a78bfa]">
                              {u.user_name[0]?.toUpperCase()}
                            </div>
                            <span className="text-[#94a3b8] group-hover:text-white transition-colors">{u.user_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[#475569] tabular-nums font-mono">{formatNumber(u.session_count)}</td>
                        <td className="px-5 py-2.5 text-[#475569]">{formatBytes(u.bytes_total)}</td>
                        <td className="px-5 py-2.5">
                          {u.blocked_count > 0
                            ? <span className="font-bold text-[#f87171]">{u.blocked_count}</span>
                            : <span className="text-[#1e3a5f]">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
