'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn, severityBadge, formatRelativeTime } from '@/shared/lib/utils'
import { updateAlertStatus } from '@/features/alerts/services/alerts.service'
import type { AlertWithEvent, AlertStatus } from '@/shared/types/database'
import { CheckCircle, Eye, XCircle, ChevronDown, ChevronUp, Shield, Network, Activity, Globe } from 'lucide-react'

interface AlertCardProps { alert: AlertWithEvent; canAction?: boolean }

const STATUS_NEXT: Record<AlertStatus, { label: string; next: AlertStatus; icon: typeof CheckCircle; color: string }> = {
  open:           { label: 'Reconocer', next: 'acknowledged', icon: Eye,         color: 'text-yellow-400 hover:bg-yellow-500/10' },
  acknowledged:   { label: 'Resolver',  next: 'resolved',     icon: CheckCircle, color: 'text-green-400 hover:bg-green-500/10' },
  resolved:       { label: 'Reabrir',   next: 'open',         icon: XCircle,     color: 'text-slate-400 hover:bg-slate-500/10' },
  false_positive: { label: 'Reabrir',   next: 'open',         icon: XCircle,     color: 'text-slate-400 hover:bg-slate-500/10' },
}

const STATUS_LABELS: Record<AlertStatus, string> = {
  open:           'Abierta',
  acknowledged:   'Reconocida',
  resolved:       'Resuelta',
  false_positive: 'Falso positivo',
}

const STATUS_STYLE: Record<AlertStatus, string> = {
  open:           'text-[#f87171] bg-[#ef4444]/10 border-[#ef4444]/30',
  acknowledged:   'text-[#fbbf24] bg-[#f59e0b]/10 border-[#f59e0b]/30',
  resolved:       'text-[#4ade80] bg-[#22c55e]/10 border-[#22c55e]/30',
  false_positive: 'text-[#94a3b8] bg-[#64748b]/10 border-[#64748b]/30',
}

function formatBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

export function AlertCard({ alert, canAction = true }: AlertCardProps) {
  const router    = useRouter()
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(false)
  const transition = STATUS_NEXT[alert.status]
  const ev = alert.firewall_event as (typeof alert.firewall_event & {
    firewall_rule?: string | null
    protocol?: string | null
    src_port?: number | null
    dst_port?: number | null
    src_country?: string | null
    dst_country?: string | null
    user_name?: string | null
    application?: string | null
    bytes_sent?: number
    bytes_received?: number
    threat_name?: string | null
    threat_category?: string | null
  }) | undefined

  async function handleAction() {
    setLoading(true)
    await updateAlertStatus(alert.id, transition.next)
    setLoading(false)
    router.refresh()
  }

  const sevBorder =
    alert.severity === 'critical' ? 'border-red-500/40' :
    alert.severity === 'high'     ? 'border-orange-500/30' :
    'border-[#0f2038]'

  return (
    <div className={cn('glass rounded-2xl border transition-all', sevBorder, expanded && 'shadow-lg')}>
      <div className="p-5">
        {/* Main row */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-2 h-2 rounded-full mt-1.5 shrink-0',
            alert.severity === 'critical' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' :
            alert.severity === 'high'     ? 'bg-orange-500' :
            alert.severity === 'medium'   ? 'bg-yellow-500' : 'bg-blue-500'
          )} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm">{alert.title}</p>
                <p className="text-xs text-[#334155] mt-0.5">{alert.type}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', STATUS_STYLE[alert.status])}>
                  {STATUS_LABELS[alert.status]}
                </span>
                <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium', severityBadge(alert.severity))}>
                  {alert.severity}
                </span>
              </div>
            </div>

            {alert.description && (
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">{alert.description}</p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-[#334155]">
              {alert.device && <span>📡 {alert.device.name}</span>}
              {ev && (
                <span className="font-mono text-[#475569]">
                  {ev.src_ip} → {ev.dst_ip}
                </span>
              )}
              <span className="ml-auto text-[#1e3a5f]">{formatRelativeTime(alert.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#0f2038]">
          {canAction && alert.status !== 'resolved' && alert.status !== 'false_positive' && (
            <button
              onClick={handleAction}
              disabled={loading}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors', transition.color, loading && 'opacity-50 cursor-not-allowed')}
            >
              <transition.icon className="w-3.5 h-3.5" />
              {transition.label}
            </button>
          )}
          {canAction && (
            <button
              onClick={() => updateAlertStatus(alert.id, 'false_positive').then(() => router.refresh())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#475569] hover:text-[#94a3b8] transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Falso positivo
            </button>
          )}

          {/* Toggle detalle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors"
          >
            {expanded ? 'Ocultar detalle' : 'Ver detalle'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Detail panel */}
      {expanded && (
        <div className="border-t border-[#0f2038] px-5 pb-5 pt-4 space-y-4 animate-fade-in">

          {/* Event network detail */}
          {ev && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-[#334155]" />
                <span className="text-[10px] font-bold text-[#334155] uppercase tracking-widest">Red</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pl-5">
                {[
                  { label: 'IP Origen',      value: ev.src_ip,       mono: true },
                  { label: 'IP Destino',     value: ev.dst_ip,       mono: true },
                  { label: 'Puerto origen',  value: ev.src_port,     mono: true },
                  { label: 'Puerto destino', value: ev.dst_port,     mono: true },
                  { label: 'Protocolo',      value: ev.protocol?.toUpperCase(), mono: true },
                  { label: 'Acción',         value: ev.event_type,   mono: false },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest">{f.label}</span>
                    <span className={`text-xs text-[#94a3b8] ${f.mono ? 'font-mono' : ''}`}>{f.value ?? '—'}</span>
                  </div>
                ))}
              </div>

              {/* Firewall rule */}
              {ev.firewall_rule && (
                <div className="pl-5">
                  <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-1">Regla aplicada</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#60a5fa]">
                    {ev.firewall_rule}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Geography */}
          {ev && (ev.src_country || ev.dst_country) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#334155]" />
                <span className="text-[10px] font-bold text-[#334155] uppercase tracking-widest">Geografía</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 pl-5">
                <div>
                  <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">País origen</span>
                  <span className="text-xs text-[#94a3b8]">{ev.src_country ?? '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">País destino</span>
                  <span className="text-xs text-[#94a3b8]">{ev.dst_country ?? '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Threat */}
          {ev && (ev.threat_name || ev.threat_category) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#ef4444]" />
                <span className="text-[10px] font-bold text-[#ef4444]/70 uppercase tracking-widest">Amenaza detectada</span>
              </div>
              <div className="pl-5 grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">Nombre</span>
                  <span className="text-xs text-[#f87171] font-medium">{ev.threat_name ?? '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">Categoría</span>
                  <span className="text-xs text-[#94a3b8]">{ev.threat_category ?? '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Identity + stats */}
          {ev && (ev.user_name || ev.application || (ev.bytes_sent ?? 0) > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#334155]" />
                <span className="text-[10px] font-bold text-[#334155] uppercase tracking-widest">Actividad</span>
              </div>
              <div className="pl-5 grid grid-cols-2 gap-x-6 gap-y-2">
                {ev.user_name && (
                  <div>
                    <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">Usuario</span>
                    <span className="text-xs text-[#94a3b8]">{ev.user_name}</span>
                  </div>
                )}
                {ev.application && (
                  <div>
                    <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">Aplicación</span>
                    <span className="text-xs text-[#94a3b8]">{ev.application}</span>
                  </div>
                )}
                {(ev.bytes_sent ?? 0) > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">Bytes enviados</span>
                    <span className="text-xs text-[#94a3b8] font-mono">{formatBytes(ev.bytes_sent ?? 0)}</span>
                  </div>
                )}
                {(ev.bytes_received ?? 0) > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-0.5">Bytes recibidos</span>
                    <span className="text-xs text-[#94a3b8] font-mono">{formatBytes(ev.bytes_received ?? 0)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {alert.notes && (
            <div className="bg-[#0a1628] rounded-xl px-4 py-3 text-xs text-[#64748b] border border-[#0f2038]">
              <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest block mb-1">Notas del analista</span>
              {alert.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
