'use client'

import { useEventsStore } from '@/features/dashboard/store/events.store'
import { useRealtimeEvents } from '@/features/dashboard/hooks/use-realtime-events'
import { formatRelativeTime } from '@/shared/lib/utils'
import { Zap, Radio, ArrowRight } from 'lucide-react'

const MAX_VISIBLE = 5

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  allow:       { label: 'Permitido',  color: 'text-[#4ade80]' },
  deny:        { label: 'Denegado',   color: 'text-[#f87171]' },
  drop:        { label: 'Descartado', color: 'text-[#f87171]' },
  reset:       { label: 'Reset',      color: 'text-[#fbbf24]' },
  monitor:     { label: 'Monitor',    color: 'text-[#60a5fa]' },
  redirect:    { label: 'Redirigido', color: 'text-[#a78bfa]' },
  passthrough: { label: 'Permitido',  color: 'text-[#4ade80]' },
  blocked:     { label: 'Denegado',   color: 'text-[#f87171]' },
}

const SUBTYPE_LABELS: Record<string, string> = {
  webfilter:  'Web Filter',
  'app-ctrl': 'App Control',
  ips:        'IPS',
  virus:      'Antivirus',
  anomaly:    'Anomalía',
  vpn:        'VPN',
  system:     'Sistema',
  user:       'Usuario',
}

const TYPE_LABELS: Record<string, string> = {
  traffic: 'Tráfico',
  threat:  'Amenaza',
  vpn:     'VPN',
  system:  'Sistema',
  auth:    'Auth',
}

const sevColor: Record<string, { dot: string; badge: string }> = {
  critical: { dot: '#ef4444', badge: 'text-[#f87171] bg-[#ef4444]/10' },
  high:     { dot: '#f97316', badge: 'text-[#fb923c] bg-[#f97316]/10' },
  medium:   { dot: '#f59e0b', badge: 'text-[#fbbf24] bg-[#f59e0b]/10' },
  low:      { dot: '#3b82f6', badge: 'text-[#60a5fa] bg-[#3b82f6]/10' },
  info:     { dot: '#64748b', badge: 'text-[#94a3b8] bg-[#64748b]/10' },
}

export function LiveEventsWidget({ orgId }: { orgId: string }) {
  useRealtimeEvents(orgId)
  const events = useEventsStore(s => s.liveEvents)
  const clear  = useEventsStore(s => s.clearEvents)

  return (
    <div className="glass rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#0f2038]">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#22c55e] to-[#16a34a]" />
          <Radio className="w-3.5 h-3.5 text-[#22c55e] animate-glow-pulse" />
          <h2 className="font-bold text-white text-sm">Eventos en vivo</h2>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <button onClick={clear} className="text-[10px] text-[#334155] hover:text-[#64748b] transition-colors font-medium">
              limpiar
            </button>
          )}
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e]" />
            </span>
            {events.length}
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <div className="w-12 h-12 rounded-xl border border-[#0f2038] flex items-center justify-center mb-3 animate-glow-pulse">
              <Zap className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <p className="text-sm text-[#334155] font-medium">Esperando eventos...</p>
            <p className="text-xs text-[#1e3a5f] mt-1">Los nuevos logs Syslog aparecerán aquí</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#0a1628]">
              {events.slice(0, MAX_VISIBLE).map((event, i) => {
                const sc = sevColor[event.severity] ?? sevColor.info
                const pd = event.parsed_data as Record<string, unknown> | null
                const subtype = pd?.['subtype'] as string | undefined
                const typeLabel = subtype
                  ? (SUBTYPE_LABELS[subtype] ?? subtype)
                  : (TYPE_LABELS[event.event_type] ?? event.event_type)
                const rawAction = (event.action ?? (pd?.['action'] as string | undefined) ?? '').toLowerCase()
                const ac = ACTION_LABELS[rawAction]
                return (
                  <div key={event.id}
                    className="px-4 py-2.5 hover:bg-[#0d1a2e]/80 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 0.02}s` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot, boxShadow: `0 0 4px ${sc.dot}` }} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sc.badge}`}>{event.severity}</span>
                          <span className="text-[10px] text-[#475569]">{typeLabel}</span>
                          {ac && (
                            <span className={`text-[10px] font-semibold ${ac.color}`}>{ac.label}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#334155] font-mono truncate">
                          {event.src_ip ?? '—'} → {event.dst_ip ?? '—'}
                        </p>
                        {event.threat_name && (
                          <p className="text-[10px] text-[#f87171] mt-0.5 truncate">{event.threat_name}</p>
                        )}
                      </div>
                      <span className="text-[9px] text-[#1e3a5f] whitespace-nowrap shrink-0 mt-0.5">
                        {formatRelativeTime(event.event_time)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {events.length > MAX_VISIBLE && (
              <a href="/traffic"
                className="flex items-center justify-between px-4 py-2.5 border-t border-[#0a1628] hover:bg-[#0d1a2e]/60 transition-colors group">
                <span className="text-[10px] text-[#334155]">
                  +{events.length - MAX_VISIBLE} eventos más
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#3b82f6] group-hover:text-[#60a5fa] transition-colors font-medium">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </span>
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}
