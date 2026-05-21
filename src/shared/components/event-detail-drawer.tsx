'use client'

import { useEffect } from 'react'
import { X, Shield, Network, User, Globe, Activity, Clock, Database, ExternalLink } from 'lucide-react'
import type { FirewallEventWithDevice } from '@/shared/types/database'
import Link from 'next/link'

function formatBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

function formatDuration(ms: number | null) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

const SEV_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  critical: { bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/40', text: 'text-[#f87171]', dot: 'bg-[#ef4444]' },
  high:     { bg: 'bg-[#f97316]/10', border: 'border-[#f97316]/40', text: 'text-[#fb923c]', dot: 'bg-[#f97316]' },
  medium:   { bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/40', text: 'text-[#fbbf24]', dot: 'bg-[#f59e0b]' },
  low:      { bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/40', text: 'text-[#60a5fa]', dot: 'bg-[#3b82f6]' },
  info:     { bg: 'bg-[#64748b]/10', border: 'border-[#64748b]/40', text: 'text-[#94a3b8]', dot: 'bg-[#64748b]' },
}

const ACTION_COLORS: Record<string, string> = {
  allow:   'text-[#4ade80] bg-[#22c55e]/10 border-[#22c55e]/30',
  deny:    'text-[#f87171] bg-[#ef4444]/10 border-[#ef4444]/30',
  drop:    'text-[#f87171] bg-[#ef4444]/10 border-[#ef4444]/30',
  reset:   'text-[#fbbf24] bg-[#f59e0b]/10 border-[#f59e0b]/30',
  monitor: 'text-[#60a5fa] bg-[#3b82f6]/10 border-[#3b82f6]/30',
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest">{label}</span>
      <span className={`text-xs text-[#94a3b8] ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[#334155]" />
        <span className="text-[10px] font-bold text-[#334155] uppercase tracking-widest">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 pl-5">
        {children}
      </div>
    </div>
  )
}

interface Props {
  event: FirewallEventWithDevice | null
  onClose: () => void
}

export function EventDetailDrawer({ event, onClose }: Props) {
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!event) return null

  const sev = SEV_COLORS[event.severity] ?? SEV_COLORS.info
  const actionCls = ACTION_COLORS[event.action ?? ''] ?? 'text-[#64748b] bg-[#64748b]/10 border-[#64748b]/30'
  const ts = new Date(event.event_time)
  const isBlocked = ['deny', 'drop', 'block', 'reset'].includes(event.action ?? '')

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] flex flex-col"
        style={{
          background: 'rgba(6, 10, 18, 0.97)',
          borderLeft: '1px solid #0f2038',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
          animation: 'slideInRight 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#0f2038]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Firewall rule */}
              {event.firewall_rule && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${isBlocked ? 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#f87171]' : 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`} />
                  {event.firewall_rule}
                </span>
              )}
              {/* Severity */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.bg} ${sev.border} ${sev.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                {event.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-[#334155] mt-2 font-mono">
              ID #{event.id} · {ts.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'medium' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#334155] hover:text-white hover:bg-[#0f2038] transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Network */}
          <Section title="Red" icon={Network}>
            <Field label="IP Origen"    value={event.src_ip}    mono />
            <Field label="IP Destino"   value={event.dst_ip}    mono />
            <Field label="Puerto origen" value={event.src_port ?? '—'} mono />
            <Field label="Puerto destino" value={event.dst_port ?? '—'} mono />
            <Field label="Protocolo"    value={event.protocol?.toUpperCase() ?? '—'} mono />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-widest">Acción</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold w-fit ${actionCls}`}>
                {event.action?.toUpperCase() ?? '—'}
              </span>
            </div>
          </Section>

          <div className="h-px bg-[#0f2038]" />

          {/* Geography */}
          <Section title="Geografía" icon={Globe}>
            <Field label="País origen"  value={event.src_country ?? '—'} />
            <Field label="País destino" value={event.dst_country ?? '—'} />
          </Section>

          <div className="h-px bg-[#0f2038]" />

          {/* Identity */}
          <Section title="Identidad" icon={User}>
            <Field label="Usuario"      value={event.user_name    ?? '—'} />
            <Field label="Aplicación"   value={event.application  ?? '—'} />
            <div className="col-span-2">
              <Field label="URL" value={
                event.url
                  ? <span className="break-all text-[#60a5fa]">{event.url}</span>
                  : '—'
              } />
            </div>
          </Section>

          {/* Threat — solo si hay datos */}
          {(event.threat_name || event.threat_category) && (
            <>
              <div className="h-px bg-[#0f2038]" />
              <Section title="Amenaza detectada" icon={Shield}>
                <div className="col-span-2">
                  <Field label="Nombre de amenaza" value={
                    <span className="text-[#f87171] font-medium">{event.threat_name}</span>
                  } />
                </div>
                <Field label="Categoría" value={event.threat_category ?? '—'} />
                <Field label="Tipo de evento" value={
                  <span className="capitalize">{event.event_type}</span>
                } />
              </Section>
            </>
          )}

          <div className="h-px bg-[#0f2038]" />

          {/* Traffic stats */}
          <Section title="Estadísticas de sesión" icon={Activity}>
            <Field label="Bytes enviados"   value={formatBytes(event.bytes_sent ?? 0)}     mono />
            <Field label="Bytes recibidos"  value={formatBytes(event.bytes_received ?? 0)} mono />
            <Field label="Duración"         value={formatDuration(event.duration_ms)}       mono />
            <Field label="Tipo de evento"   value={<span className="capitalize">{event.event_type}</span>} />
          </Section>

          {/* Device */}
          {event.device && (
            <>
              <div className="h-px bg-[#0f2038]" />
              <Section title="Dispositivo" icon={Database}>
                <Field label="Nombre"   value={event.device.name} />
                <Field label="Marca"    value={event.device.brand} />
                <Field label="IP"       value={event.device.ip_address} mono />
              </Section>
            </>
          )}

          <div className="h-px bg-[#0f2038]" />

          {/* Timestamp */}
          <Section title="Tiempo" icon={Clock}>
            <Field label="Fecha y hora" value={ts.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'medium' })} />
            <Field label="Hace" value={
              (() => {
                const diff = Date.now() - ts.getTime()
                if (diff < 60000) return `${Math.round(diff / 1000)}s`
                if (diff < 3600000) return `${Math.round(diff / 60000)}min`
                if (diff < 86400000) return `${Math.round(diff / 3600000)}h`
                return `${Math.round(diff / 86400000)}d`
              })()
            } />
          </Section>
        </div>

        {/* Footer — acciones rápidas */}
        <div className="px-6 py-4 border-t border-[#0f2038] flex flex-wrap gap-2">
          {event.src_ip && (
            <Link
              href={`/traffic?src_ip=${encodeURIComponent(String(event.src_ip))}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#60a5fa] bg-[#3b82f6]/10 border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Ver IP origen en tráfico
            </Link>
          )}
          {event.application && (
            <Link
              href={`/traffic?search=${encodeURIComponent(event.application)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#a78bfa] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 hover:bg-[#8b5cf6]/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Ver aplicación en tráfico
            </Link>
          )}
          {event.user_name && (
            <Link
              href={`/traffic?search=${encodeURIComponent(event.user_name)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#fbbf24] bg-[#f59e0b]/10 border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Ver usuario en tráfico
            </Link>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </>
  )
}
