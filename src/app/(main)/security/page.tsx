import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { LiveRefresh } from '@/shared/components/live-refresh'
import {
  getSecuritySummary, getThreatCategories, getTopAttackSources, getGeoAttacks, getAffectedUsers
} from '@/features/security/services/security.service'
import { formatNumber } from '@/shared/lib/utils'
import { ShieldAlert, Bug, Globe, Users, Siren, Network, ShieldX } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_COLORS: Record<string, string> = {
  ips:       '#ef4444',
  malware:   '#f97316',
  botnet:    '#a855f7',
  phishing:  '#f59e0b',
}

function getCategoryColor(cat: string): string {
  const lower = cat.toLowerCase()
  if (['intrusion', 'exploit', 'scan', 'probe', 'attack', 'ips', 'vulnerability'].some(k => lower.includes(k))) return '#ef4444'
  if (['malware', 'adware', 'spyware', 'ransomware', 'trojan', 'virus', 'worm'].some(k => lower.includes(k))) return '#f97316'
  if (['botnet', 'c2', 'command-and-control', 'bot'].some(k => lower.includes(k))) return '#a855f7'
  if (['phishing', 'fraud', 'social-engineering', 'credential'].some(k => lower.includes(k))) return '#f59e0b'
  return '#64748b'
}

export default async function SecurityPage() {
  const hours = 24
  const label = 'últimas 24h'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = profile?.org_id ?? ''

  const [summary, threatCategories, attackSources, geoAttacks, affectedUsers] = await Promise.all([
    getSecuritySummary(orgId, hours),
    getThreatCategories(orgId, hours),
    getTopAttackSources(orgId, hours),
    getGeoAttacks(orgId, hours),
    getAffectedUsers(orgId, hours),
  ])

  const totalThreats = summary.ips_attacks + summary.malware_events + summary.botnet_events + summary.phishing_events

  const statCards = [
    { label: 'Ataques IPS/Intrusión', value: formatNumber(summary.ips_attacks),    icon: ShieldAlert, color: '#ef4444' },
    { label: 'Malware / Spyware',     value: formatNumber(summary.malware_events), icon: Bug,         color: '#f97316' },
    { label: 'Botnet / C2',           value: formatNumber(summary.botnet_events),  icon: Network,     color: '#a855f7' },
    { label: 'Phishing / Fraude',     value: formatNumber(summary.phishing_events),icon: Siren,       color: '#f59e0b' },
    { label: 'Fuentes únicas',        value: formatNumber(summary.unique_sources), icon: Globe,       color: '#06b6d4' },
    { label: 'Total bloqueados',      value: formatNumber(summary.total_blocked),  icon: ShieldX,     color: '#22c55e' },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={false} />
      <Topbar title="Inteligencia de Seguridad" subtitle={`${formatNumber(totalThreats)} amenazas detectadas · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {statCards.map(({ label: lbl, value, icon: Icon, color }) => (
            <div key={lbl} className="glass rounded-2xl p-5 relative overflow-hidden hover-card">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full blur-xl opacity-20"
                style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
              <div className="absolute bottom-0 left-0 right-0 h-px opacity-30"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
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

          {/* Threat Categories */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#ef4444] to-[#dc2626]" />
              <ShieldAlert className="w-4 h-4 text-[#f87171]" />
              <h2 className="font-bold text-white text-sm">Categorías de amenazas</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{threatCategories.length}</span>
            </div>
            {threatCategories.length === 0 ? (
              <div className="p-10 text-center">
                <ShieldAlert className="w-8 h-8 text-[#22c55e]/40 mx-auto mb-3" />
                <p className="text-xs text-[#334155]">Sin amenazas detectadas en el período</p>
              </div>
            ) : (
              <div className="p-5 space-y-2">
                {threatCategories.slice(0, 12).map(({ category, total, blocked }) => {
                  const maxTotal = threatCategories[0]?.total ?? 1
                  const pct = Math.round((total / maxTotal) * 100)
                  const color = getCategoryColor(category)
                  const blockPct = total > 0 ? Math.round((blocked / total) * 100) : 0
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-[#94a3b8] flex-1 truncate capitalize">{category}</span>
                      <div className="w-24 bg-[#060a12] rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color }}>{total}</span>
                      <span className="text-[10px] text-[#475569] w-14 text-right tabular-nums">{blockPct}% blq</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Geo Attacks */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" />
              <Globe className="w-4 h-4 text-[#22d3ee]" />
              <h2 className="font-bold text-white text-sm">Origen geográfico de ataques</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{geoAttacks.length} países</span>
            </div>
            {geoAttacks.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#334155]">Sin datos de geolocalización</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#0a1628]">
                      {['#', 'País', 'Ataques', 'Bloqueados', '%'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {geoAttacks.map(({ country, count, blocked }, i) => {
                      const pct = count > 0 ? Math.round((blocked / count) * 100) : 0
                      return (
                        <tr key={country} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors">
                          <td className="px-4 py-2 text-[10px] font-bold text-[#1e3a5f]">{i + 1}</td>
                          <td className="px-4 py-2 text-[#94a3b8] font-medium">{country}</td>
                          <td className="px-4 py-2 text-[#f87171] font-bold tabular-nums">{formatNumber(count)}</td>
                          <td className="px-4 py-2 text-[#22c55e] tabular-nums">{formatNumber(blocked)}</td>
                          <td className="px-4 py-2 text-[#475569] tabular-nums">{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Top Attack Sources */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#a855f7] to-[#9333ea]" />
              <Network className="w-4 h-4 text-[#c084fc]" />
              <h2 className="font-bold text-white text-sm">IPs origen de ataques</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{attackSources.length} IPs</span>
            </div>
            {attackSources.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#334155]">Sin ataques detectados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#0a1628]">
                      {['IP', 'País', 'Ataques', 'Bloqueados', 'Categorías'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attackSources.map(src => (
                      <tr key={src.src_ip} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                        <td className="px-4 py-2 font-mono text-[#c084fc] text-[10px] group-hover:text-[#d8b4fe] transition-colors">{src.src_ip}</td>
                        <td className="px-4 py-2 text-[#475569]">{src.country ?? '—'}</td>
                        <td className="px-4 py-2 text-[#f87171] font-bold tabular-nums">{formatNumber(src.count)}</td>
                        <td className="px-4 py-2 text-[#22c55e] tabular-nums">{formatNumber(src.blocked)}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {src.threat_categories.slice(0, 2).map(cat => (
                              <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded font-medium capitalize"
                                style={{ background: `${getCategoryColor(cat)}20`, color: getCategoryColor(cat) }}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Affected Users */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#f59e0b] to-[#d97706]" />
              <Users className="w-4 h-4 text-[#fbbf24]" />
              <h2 className="font-bold text-white text-sm">Usuarios afectados</h2>
              <span className="ml-auto text-[10px] font-bold text-[#334155] uppercase tracking-wider">{affectedUsers.length} usuarios</span>
            </div>
            {affectedUsers.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#334155]">Sin usuarios afectados identificados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#0a1628]">
                      {['Usuario', 'Eventos', 'Bloqueados', 'Amenazas'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-[#1e3a5f] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {affectedUsers.map(u => (
                      <tr key={u.user_name} className="border-b border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/25 flex items-center justify-center text-[9px] font-bold text-[#fbbf24]">
                              {u.user_name[0]?.toUpperCase()}
                            </div>
                            <span className="text-[#94a3b8] group-hover:text-white transition-colors">{u.user_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-[#f87171] font-bold tabular-nums">{formatNumber(u.events)}</td>
                        <td className="px-4 py-2 text-[#22c55e] tabular-nums">{formatNumber(u.blocked)}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {u.categories.slice(0, 2).map(cat => (
                              <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                                style={{ background: `${getCategoryColor(cat)}20`, color: getCategoryColor(cat) }}>
                                {cat}
                              </span>
                            ))}
                          </div>
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
