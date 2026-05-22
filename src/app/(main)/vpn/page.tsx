import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { TimeFilter } from '@/shared/components/time-filter'
import { resolveHours } from '@/shared/lib/time'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { getVpnStats, getVpnUsers, getVpnSessions, getVpnFailedLogins, getVpnActiveSessions } from '@/features/vpn/services/vpn.service'
import { formatBytes, formatNumber } from '@/shared/lib/utils'
import { Shield, Users, Wifi, AlertTriangle, Clock, XCircle, Radio } from 'lucide-react'

export const dynamic = 'force-dynamic'
interface PageProps { searchParams: Promise<Record<string, string>> }

export default async function VpnPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { hours, isLive, param, label } = resolveHours(sp['hours'], 24)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = profile?.org_id ?? ''

  const [stats, vpnUsers, sessions, failedLogins, activeSessions] = await Promise.all([
    getVpnStats(orgId, hours),
    getVpnUsers(orgId, hours),
    getVpnSessions(orgId, hours, 30),
    getVpnFailedLogins(orgId, hours),
    getVpnActiveSessions(orgId),
  ])

  const statCards = [
    { label: 'Sesiones VPN', value: formatNumber(stats.total_sessions), icon: Wifi,         color: '#06b6d4' },
    { label: 'Usuarios activos', value: formatNumber(stats.active_users),  icon: Users,        color: '#8b5cf6' },
    { label: 'Logins fallidos',  value: formatNumber(stats.failed_logins), icon: XCircle,      color: '#ef4444' },
    { label: 'Datos transferidos', value: formatBytes(stats.bytes_total),  icon: Shield,       color: '#22c55e' },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={isLive} />
      <Topbar title="VPN y Acceso Remoto" subtitle={`${stats.total_sessions} sesiones · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        {/* Time filter */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#334155] font-medium">Período de análisis</span>
          <TimeFilter current={param} />
        </div>

        {/* Sesiones activas AHORA — vía FortiGate API */}
        {activeSessions.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden border border-[#22c55e]/20">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#0f2038] bg-[#22c55e]/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
              </span>
              <Radio className="w-3.5 h-3.5 text-[#22c55e]" />
              <h2 className="font-bold text-white text-sm">Conectados ahora</h2>
              <span className="ml-auto text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">{activeSessions.length} usuarios</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#0a1628]">
                    {['Usuario', 'IP Remota', 'IP Túnel', 'Duración', 'Transferido', 'OS'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left font-bold text-[#1e3a5f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map(s => {
                    const h = Math.floor(s.duration_sec / 3600)
                    const m = Math.floor((s.duration_sec % 3600) / 60)
                    const dur = h > 0 ? `${h}h ${m}m` : `${m}m`
                    return (
                      <tr key={s.user_name} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
                            <span className="text-white font-medium">{s.user_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[#06b6d4] font-mono text-[10px]">{s.remote_ip ?? '—'}</td>
                        <td className="px-5 py-2.5 text-[#475569] font-mono text-[10px]">{s.tunnel_ip ?? '—'}</td>
                        <td className="px-5 py-2.5 text-[#94a3b8]">{s.duration_sec > 0 ? dur : '—'}</td>
                        <td className="px-5 py-2.5 text-[#475569]">{formatBytes(s.bytes_tx + s.bytes_rx)}</td>
                        <td className="px-5 py-2.5 text-[#334155]">{s.os_name ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* VPN Users */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed]" />
              <Users className="w-4 h-4 text-[#a78bfa]" />
              <h2 className="font-bold text-white text-sm">Usuarios VPN</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{vpnUsers.length} usuarios</span>
            </div>
            {vpnUsers.length === 0 ? (
              <div className="p-10 text-center">
                <Wifi className="w-8 h-8 text-[#1e3a5f] mx-auto mb-3" />
                <p className="text-xs text-[#334155]">Sin sesiones VPN en el período seleccionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#0a1628]">
                      {['Usuario / IP', 'Sesiones', 'Datos', 'Fallidos', 'Última IP'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vpnUsers.map(u => (
                      <tr key={u.user_name} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/25 flex items-center justify-center text-[10px] font-bold text-[#a78bfa]">
                              {u.user_name[0]?.toUpperCase()}
                            </div>
                            <span className="text-[#94a3b8] font-medium group-hover:text-white transition-colors">{u.user_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[#475569] tabular-nums font-mono">{formatNumber(u.session_count)}</td>
                        <td className="px-5 py-3 text-[#475569]">{formatBytes(u.bytes_total)}</td>
                        <td className="px-5 py-3">
                          {u.failed_logins > 0
                            ? <span className="flex items-center gap-1 text-[#f87171] font-bold"><XCircle className="w-3 h-3" />{u.failed_logins}</span>
                            : <span className="text-[#1e3a5f]">—</span>}
                        </td>
                        <td className="px-5 py-3 text-[#475569] font-mono text-[10px]">{u.last_ip ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Failed Logins */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#ef4444] to-[#dc2626]" />
              <AlertTriangle className="w-4 h-4 text-[#f87171]" />
              <h2 className="font-bold text-white text-sm">IPs con logins fallidos</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{failedLogins.length} IPs</span>
            </div>
            {failedLogins.length === 0 ? (
              <div className="p-10 text-center">
                <Shield className="w-8 h-8 text-[#22c55e]/50 mx-auto mb-3" />
                <p className="text-xs text-[#334155]">Sin intentos fallidos en el período</p>
              </div>
            ) : (
              <div className="p-5 space-y-2">
                {failedLogins.map(({ src_ip, count }, i) => {
                  const maxCount = failedLogins[0]?.count ?? 1
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={src_ip} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#1e3a5f] w-4 tabular-nums">{i + 1}</span>
                      <span className="font-mono text-[#f87171] text-xs w-36 truncate">{src_ip}</span>
                      <div className="flex-1 bg-[#060a12] rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                      </div>
                      <span className="text-xs font-bold text-[#ef4444] tabular-nums w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" />
            <Clock className="w-4 h-4 text-[#22d3ee]" />
            <h2 className="font-bold text-white text-sm">Sesiones recientes</h2>
            <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{sessions.length} sesiones</span>
          </div>
          {sessions.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#334155]">Sin sesiones en el período seleccionado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#0a1628]">
                    {['Hora', 'Usuario', 'IP origen', 'Acción', 'Duración', 'Datos'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => {
                    const isBlocked = s.action === 'deny' || s.action === 'drop'
                    return (
                      <tr key={i} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors">
                        <td className="px-5 py-2.5 text-[#334155] font-mono text-[10px]">
                          {new Date(s.event_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-5 py-2.5 text-[#94a3b8]">{s.user_name ?? '—'}</td>
                        <td className="px-5 py-2.5 text-[#06b6d4] font-mono text-[10px]">{s.src_ip ?? '—'}</td>
                        <td className="px-5 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isBlocked ? 'bg-[#ef4444]/15 text-[#f87171]' : 'bg-[#22c55e]/15 text-[#4ade80]'}`}>
                            {s.action?.toUpperCase() ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-[#475569] font-mono text-[10px]">
                          {s.duration_ms ? `${Math.round(s.duration_ms / 1000)}s` : '—'}
                        </td>
                        <td className="px-5 py-2.5 text-[#475569]">{formatBytes((s.bytes_sent ?? 0) + (s.bytes_received ?? 0))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
