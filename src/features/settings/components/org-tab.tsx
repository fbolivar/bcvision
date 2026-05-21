'use client'

import { Building2, Server, Clock, CreditCard } from 'lucide-react'

interface Org {
  id: string
  name: string
  slug: string
  plan: string
  max_devices: number
  retention_days: number
}

interface Props {
  org: Org | null
  isAdmin: boolean
}

const planLabels: Record<string, { label: string; color: string }> = {
  free:         { label: 'Free',         color: 'text-[#6b7280] bg-[#374151]/50 border-\[#0f2038\]' },
  professional: { label: 'Professional', color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
  enterprise:   { label: 'Enterprise',   color: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30' },
}

export function OrgTab({ org, isAdmin }: Props) {
  if (!org) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6b7280] text-sm">
        No se encontró la organización
      </div>
    )
  }

  const plan = planLabels[org.plan] ?? planLabels.free

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Organización</h2>
        <p className="text-sm text-[#6b7280]">Información y límites del plan actual</p>
      </div>

      {/* Org info */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#3b82f6]" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{org.name}</div>
            <div className="text-xs text-[#6b7280] font-mono mt-0.5">{org.slug}</div>
          </div>
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${plan.color}`}>
            {plan.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Server, label: 'Dispositivos máx.', value: org.max_devices.toString() },
            { icon: Clock,  label: 'Retención de logs', value: `${org.retention_days} días` },
            { icon: CreditCard, label: 'Plan', value: plan.label },
          ].map(s => (
            <div key={s.label} className="bg-\[#060a12\]/80 rounded-xl p-4">
              <s.icon className="w-4 h-4 text-[#6b7280] mb-2" />
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-xs text-[#6b7280] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Syslog config */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Configuración Syslog</h3>
        <p className="text-xs text-[#6b7280] mb-4">
          Apunta tus firewalls a este servidor para ingestar logs en tiempo real.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Protocolo UDP', value: 'Puerto 514 (RFC 3164 / RFC 5424)' },
            { label: 'Protocolo TCP', value: 'Puerto 514 (stream)' },
            { label: 'Fabricantes', value: 'Fortinet · Cisco ASA · pfSense · Sophos · Palo Alto · MikroTik · Genérico' },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2 border-b border-[#2d3148] last:border-0">
              <span className="text-xs text-[#9ca3af]">{r.label}</span>
              <span className="text-xs text-white font-mono">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <p className="text-xs text-[#4b5563] text-center">
          Solo los administradores pueden modificar la configuración de la organización.
        </p>
      )}
    </div>
  )
}
