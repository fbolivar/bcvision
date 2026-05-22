import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { AddDeviceForm } from '@/features/devices/components/add-device-form'
import { DeviceCard } from '@/features/devices/components/device-card'
import type { Device, FirewallBrand } from '@/shared/types/database'
import { Monitor, Radio } from 'lucide-react'

export const dynamic = 'force-dynamic'
interface PageProps { searchParams: Promise<Record<string, string>> }

const SYSLOG_INSTRUCTIONS: Record<FirewallBrand, string[]> = {
  fortinet:  ['System > Log & Report > Log Settings','Enable Syslog, Set server IP al listener','Port: 514, Protocol: UDP, Facility: local7','Log level: Information'],
  cisco:     ['logging host <IP_LISTENER>','logging trap informational','logging facility local7','logging on'],
  pfsense:   ['Status > System Logs > Settings','Enable Remote Logging','Remote log servers: <IP_LISTENER>:514','Mark: Firewall Events'],
  sophos:    ['Sophos Central > System > Diagnostics','Syslog Servers > Add Server','IP: <IP_LISTENER>, Port: 514, Protocol: UDP','Log level: Information'],
  paloalto:  ['Device > Server Profiles > Syslog','Add profile with Name, Server IP, Port 514','Device > Log Settings > Traffic/Threat','Assign syslog profile'],
  mikrotik:  ['/system logging action add name=remote target=remote remote=<IP_LISTENER>','/system logging add topics=firewall action=remote','/system logging add topics=info action=remote'],
  generic:   ['Configura el servidor syslog con:','IP: <IP_LISTENER>, Puerto: 514','Protocolo: UDP (recomendado) o TCP','Formato: RFC 3164 o RFC 5424'],
}

export default async function DevicesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const label = 'últimas 24h'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase.from('users').select('org_id, role').eq('id', user!.id).single()
  const orgId      = profile?.org_id ?? ''
  const canManage  = ['admin', 'analyst'].includes(profile?.role ?? '')

  const { data: devicesData } = await supabase
    .from('devices').select('*').eq('org_id', orgId)
    .order('created_at', { ascending: false })
  const devices = (devicesData ?? []) as Device[]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={false} />
      <Topbar title="Dispositivos" subtitle={`${devices.length} dispositivo${devices.length !== 1 ? 's' : ''} activo${devices.length !== 1 ? 's' : ''} · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        {/* Controls row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#475569]">
            Registra tus firewalls para que el listener los reconozca por IP y aplique el parser correcto.
          </p>
          <div className="flex items-center gap-3">
            {canManage && <AddDeviceForm orgId={orgId} />}
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="glass rounded-2xl border border-dashed border-[#1e3a5f] p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-30" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl border border-[#1e3a5f] flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-[#1e3a5f]" />
              </div>
              <p className="text-[#64748b] font-semibold text-sm">Sin dispositivos activos en {label}</p>
              <p className="text-[#334155] text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                Amplia el rango de tiempo o agrega tu primer firewall con el botón superior.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {devices.map(device => (
              <div key={device.id} className="space-y-3">
                <DeviceCard device={device} canManage={canManage} />
                <details className="glass rounded-xl overflow-hidden group">
                  <summary className="flex items-center gap-2 px-4 py-3 text-xs text-[#475569] cursor-pointer hover:text-[#94a3b8] transition-colors select-none">
                    <Radio className="w-3 h-3 text-[#3b82f6]" />
                    Instrucciones Syslog · {device.brand}
                  </summary>
                  <div className="px-4 pb-4 border-t border-[#0f2038]">
                    <ol className="space-y-1.5 mt-3">
                      {(SYSLOG_INSTRUCTIONS[device.brand] ?? []).map((step, i) => (
                        <li key={i} className="flex gap-2 text-[10px]">
                          <span className="text-[#1e3a5f] font-bold shrink-0 mt-0.5">{i + 1}.</span>
                          <code className="text-[#64748b] break-all font-mono">{step}</code>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 pt-3 border-t border-[#0a1628] flex flex-wrap gap-3 text-[10px]">
                      <span className="text-[#334155]">Listener IP: <code className="text-[#60a5fa] font-mono">{'<IP_SERVIDOR>'}</code></span>
                      <span className="text-[#334155]">Puerto: <code className="text-[#60a5fa] font-mono">514 UDP/TCP</code></span>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
