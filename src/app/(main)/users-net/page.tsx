import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { getUserActivity, getTopSourceIps } from '@/features/users-net/services/users-net.service'
import { formatBytes, formatNumber } from '@/shared/lib/utils'
import { Users, Network, ShieldX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UsersNetPage() {
  const hours = 24
  const label = 'últimas 24h'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = profile?.org_id ?? ''
  const [users, topIps] = await Promise.all([getUserActivity(orgId, hours), getTopSourceIps(orgId, hours, 15)])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={false} />
      <Topbar title="Usuarios de red" subtitle={`Actividad de usuarios e IPs · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Usuarios */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed]" />
              <Users className="w-4 h-4 text-[#a78bfa]" />
              <h2 className="font-bold text-white text-sm">Usuarios identificados</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{users.length} usuarios</span>
            </div>
            {users.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="w-8 h-8 text-[#1e3a5f] mx-auto mb-3" />
                <p className="text-xs text-[#334155] leading-relaxed max-w-xs mx-auto">
                  Sin usuarios identificados. Requiere integración con Active Directory o autenticación en el firewall.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#0a1628]">
                      {['Usuario','Eventos','Datos','Bloqueados','Última actividad'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.user_name} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/25 flex items-center justify-center text-[10px] font-bold text-[#a78bfa]">
                              {u.user_name[0]?.toUpperCase()}
                            </div>
                            <span className="text-[#94a3b8] font-medium group-hover:text-white transition-colors">{u.user_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[#475569] tabular-nums font-mono">{formatNumber(u.event_count)}</td>
                        <td className="px-5 py-3 text-[#475569]">{formatBytes(u.bytes_total)}</td>
                        <td className="px-5 py-3">
                          {u.blocked_count > 0
                            ? <span className="flex items-center gap-1 text-[#f87171] font-bold"><ShieldX className="w-3 h-3" />{u.blocked_count}</span>
                            : <span className="text-[#1e3a5f]">—</span>}
                        </td>
                        <td className="px-5 py-3 text-[#334155] font-mono">
                          {new Date(u.last_seen).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top IPs */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" />
              <Network className="w-4 h-4 text-[#22d3ee]" />
              <h2 className="font-bold text-white text-sm">Top IPs más activas</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{topIps.length} IPs</span>
            </div>
            {topIps.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#334155]">Sin actividad en el período seleccionado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#0a1628]">
                      {['IP origen','Eventos','Datos','Bloqueados'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topIps.map((ip, i) => (
                      <tr key={ip.src_ip} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#1e3a5f] w-4 tabular-nums">{i + 1}</span>
                            <span className="font-mono text-[#06b6d4] group-hover:text-[#22d3ee] transition-colors">{ip.src_ip}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[#475569] tabular-nums font-mono">{formatNumber(ip.event_count)}</td>
                        <td className="px-5 py-2.5 text-[#475569]">{formatBytes(ip.bytes_total)}</td>
                        <td className="px-5 py-2.5">
                          {ip.blocked_count > 0
                            ? <span className="font-bold text-[#f87171]">{ip.blocked_count}</span>
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
