import { formatBytes } from '@/shared/lib/utils'
import type { UrlCategoryRow } from '@/features/dashboard/services/top-tables.service'
import { Globe, Users, Network, Activity } from 'lucide-react'

interface Props {
  data: UrlCategoryRow[]
}

export function UrlCategoryTable({ data }: Props) {
  const maxTraffic = data[0]?.traffic ?? 1

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" />
        <Globe className="w-4 h-4 text-[#06b6d4]" />
        <h2 className="font-bold text-white text-sm flex-1">Tráfico por Categorías de URL</h2>
        <span className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">Top {data.length} · 24h</span>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Globe className="w-8 h-8 text-[#1e3a5f] mx-auto mb-2" />
          <p className="text-xs text-[#334155]">Sin datos en las últimas 24h</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0a1628]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  <div className="flex items-center gap-1"><Globe className="w-3 h-3" />Categoría URL</div>
                </th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1"><Activity className="w-3 h-3" />Tráfico</div>
                </th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1"><Network className="w-3 h-3" />Sesiones</div>
                </th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1"><Users className="w-3 h-3" />Usuarios</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const pct = maxTraffic > 0 ? (row.traffic / maxTraffic) * 100 : 0
                const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#334155'
                return (
                  <tr key={row.category} className="border-b border-[#0a1628] last:border-0 hover:bg-[#060d1a]/60 transition-colors group">
                    <td className="px-5 py-3">
                      <span className="text-xs font-black" style={{ color: rankColor }}>{i + 1}</span>
                    </td>
                    <td className="px-5 py-3 min-w-0 max-w-[200px]">
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-white block truncate">{row.category}</span>
                        {/* Traffic bar */}
                        <div className="h-1 w-full bg-[#0a1628] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, #06b6d4, #3b82f6)`,
                              boxShadow: '0 0 6px rgba(6,182,212,0.5)',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-bold text-[#06b6d4] font-mono">{formatBytes(row.traffic)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-white font-mono">{row.sessions.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-sm font-mono ${row.users > 0 ? 'text-[#22c55e]' : 'text-[#334155]'}`}>
                        {row.users > 0 ? row.users.toLocaleString() : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
