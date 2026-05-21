'use client'

import { useState } from 'react'
import { cn, formatRelativeTime, protocolLabel } from '@/shared/lib/utils'
import type { FirewallEventWithDevice } from '@/shared/types/database'
import { EventDetailDrawer } from '@/shared/components/event-detail-drawer'

const severityConfig: Record<string, { dot: string; text: string; bg: string }> = {
  critical: { dot: 'bg-[#ef4444]', text: 'text-[#f87171]', bg: 'bg-[#ef4444]/10 border border-[#ef4444]/25' },
  high:     { dot: 'bg-[#f97316]', text: 'text-[#fb923c]', bg: 'bg-[#f97316]/10 border border-[#f97316]/25' },
  medium:   { dot: 'bg-[#f59e0b]', text: 'text-[#fbbf24]', bg: 'bg-[#f59e0b]/10 border border-[#f59e0b]/25' },
  low:      { dot: 'bg-[#3b82f6]', text: 'text-[#60a5fa]', bg: 'bg-[#3b82f6]/10 border border-[#3b82f6]/25' },
  info:     { dot: 'bg-[#64748b]', text: 'text-[#94a3b8]', bg: 'bg-[#64748b]/10 border border-[#64748b]/25' },
}

const actionConfig: Record<string, string> = {
  allow:   'text-[#4ade80]',
  deny:    'text-[#f87171]',
  drop:    'text-[#f87171]',
  reset:   'text-[#fbbf24]',
  monitor: 'text-[#60a5fa]',
}

function RuleBadge({ rule }: { rule: string | null }) {
  if (!rule) return <span className="text-[#334155]">—</span>
  const upper = rule.toUpperCase()
  const isBlock   = upper.startsWith('DENY') || upper.startsWith('DROP') || upper.startsWith('BLOCK') || upper.startsWith('RESET')
  const isMonitor = upper.startsWith('MONITOR')
  const color = isBlock
    ? 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#f87171]'
    : isMonitor
    ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#60a5fa]'
    : 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]'
  const dot = isBlock ? 'bg-[#ef4444]' : isMonitor ? 'bg-[#3b82f6]' : 'bg-[#22c55e]'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold whitespace-nowrap ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {rule}
    </span>
  )
}

interface Props { events: FirewallEventWithDevice[] }

export function RecentEventsTable({ events }: Props) {
  const [selected, setSelected] = useState<FirewallEventWithDevice | null>(null)

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-10 h-10 rounded-xl border border-[#0f2038] flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-sm text-[#334155]">Sin eventos recientes</p>
        <p className="text-xs text-[#1e3a5f] mt-1">Conecta un dispositivo Syslog para comenzar</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#0f2038]">
              {['Hora', 'Tipo', 'Acción', 'Proto', 'Origen', 'Destino', 'Severidad', 'Regla de Firewall'].map(h => (
                <th key={h} className="pb-3 pr-4 text-left font-bold text-[#1e3a5f] uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => {
              const sev = severityConfig[event.severity] ?? severityConfig.info
              const ac  = actionConfig[event.action ?? ''] ?? 'text-[#64748b]'
              return (
                <tr
                  key={event.id}
                  onClick={() => setSelected(event)}
                  className={cn(
                    'border-b border-[#0a1628] transition-colors group cursor-pointer',
                    selected?.id === event.id
                      ? 'bg-[#1e3a5f]/30'
                      : 'hover:bg-[#0d1a2e]/60'
                  )}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <td className="py-3 pr-4 text-[#334155] font-mono whitespace-nowrap">
                    {formatRelativeTime(event.event_time)}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[#64748b] capitalize">{event.event_type}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`font-bold capitalize ${ac}`}>{event.action ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4 text-[#475569] font-mono">
                    {protocolLabel(event.protocol)}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[#64748b] whitespace-nowrap group-hover:text-[#94a3b8] transition-colors">
                    {event.src_ip ?? '—'}
                    {event.src_port ? <span className="text-[#334155]">:{event.src_port}</span> : null}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[#64748b] whitespace-nowrap group-hover:text-[#94a3b8] transition-colors">
                    {event.dst_ip ?? '—'}
                    {event.dst_port ? <span className="text-[#334155]">:{event.dst_port}</span> : null}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sev.bg} ${sev.text}`}>
                      <span className={`w-1 h-1 rounded-full ${sev.dot}`} />
                      {event.severity}
                    </span>
                  </td>
                  <td className="py-3">
                    <RuleBadge rule={event.firewall_rule} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <EventDetailDrawer event={selected} onClose={() => setSelected(null)} />
    </>
  )
}
