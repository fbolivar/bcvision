import type { UserIpRow } from '@/features/dashboard/services/top-tables.service'
import { User, MapPin, Cpu, Activity } from 'lucide-react'

interface Props {
  data: UserIpRow[]
}

export function UserIpTable({ data }: Props) {
  const maxSessions = data.reduce((m, r) => Math.max(m, r.sessions ?? 0), 1)

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0f2038]">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9]" />
        <User className="w-4 h-4 text-[#8b5cf6]" />
        <h2 className="font-bold text-white text-sm flex-1">Tráfico de Usuarios y Direcciones IP</h2>
        <span className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">Top {data.length} usuarios</span>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <User className="w-8 h-8 text-[#1e3a5f] mx-auto mb-2" />
          <p className="text-xs text-[#334155]">Sin datos en las últimas 24h</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0a1628]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  <div className="flex items-center gap-1"><User className="w-3 h-3" />Usuario Origen</div>
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />IP Origen</div>
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider hidden md:table-cell">
                  <div className="flex items-center gap-1"><Cpu className="w-3 h-3" />Aplicación</div>
                </th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1"><Activity className="w-3 h-3" />Sesiones</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const pct = maxSessions > 0 ? ((row.sessions ?? 0) / maxSessions) * 100 : 0
                const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#334155'
                const isAnon = false

                return (
                  <tr key={`${row.user_name}-${row.src_ip}-${i}`} className="border-b border-[#0a1628] last:border-0 hover:bg-[#060d1a]/60 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-xs font-black" style={{ color: rankColor }}>{i + 1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          isAnon
                            ? 'bg-[#334155]/30 text-[#475569]'
                            : 'bg-[#8b5cf6]/20 text-[#a78bfa]'
                        }`}>
                          {isAnon ? '?' : row.user_name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-sm ${isAnon ? 'text-[#475569] italic' : 'text-white font-medium'} truncate max-w-[120px]`}>
                          {row.user_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-[#06b6d4] font-mono">{row.src_ip}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#60a5fa] font-mono">
                        {row.application}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-[#8b5cf6] font-mono">{(row.sessions ?? 0).toLocaleString()}</span>
                        <div className="h-1 w-20 bg-[#0a1628] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                              boxShadow: '0 0 6px rgba(139,92,246,0.5)',
                            }}
                          />
                        </div>
                      </div>
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
