import type { Device, FirewallBrand } from '@/shared/types/database'
import { formatRelativeTime } from '@/shared/lib/utils'
import { Wifi, WifiOff, MapPin } from 'lucide-react'

const brandLabels: Record<FirewallBrand, string> = {
  fortinet: 'Fortinet FortiGate',
  cisco:    'Cisco ASA',
  pfsense:  'pfSense',
  sophos:   'Sophos XG',
  paloalto: 'Palo Alto Networks',
  mikrotik: 'MikroTik RouterOS',
  generic:  'Dispositivo Genérico',
}

const brandIcons: Record<FirewallBrand, string> = {
  fortinet: '🔴', cisco: '🔵', pfsense: '🟠', sophos: '🟣', paloalto: '⚫', mikrotik: '🟤', generic: '⚪',
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60_000
}

export function DeviceStatusCard({ device }: { device: Device }) {
  const online = isOnline(device.last_seen)

  return (
    <div className={`glass rounded-2xl p-4 border hover-card relative overflow-hidden ${
      online ? 'border-[#22c55e]/20' : 'border-[#0f2038]'
    }`}>
      {/* Online glow */}
      {online && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#22c55e]/8 rounded-bl-full blur-xl" />
      )}

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{brandIcons[device.brand]}</span>
            <p className="font-bold text-white text-sm truncate">{device.name}</p>
          </div>
          <p className="text-xs text-[#475569]">{brandLabels[device.brand]}</p>
          {device.model && <p className="text-xs text-[#334155] mt-0.5">{device.model}</p>}
          <p className="text-[10px] text-[#1e3a5f] font-mono mt-1.5">{device.ip_address}</p>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 border ${
          online
            ? 'bg-[#22c55e]/10 text-[#4ade80] border-[#22c55e]/25'
            : 'bg-[#334155]/20 text-[#475569] border-[#1e2d3d]'
        }`}>
          {online
            ? <><Wifi className="w-2.5 h-2.5" /> Online</>
            : <><WifiOff className="w-2.5 h-2.5" /> Offline</>}
        </span>
      </div>

      {device.location && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-[#334155]">
          <MapPin className="w-2.5 h-2.5" />
          {device.location}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#0a1628] flex items-center justify-between">
        <span className="text-[10px] text-[#1e3a5f] font-medium uppercase tracking-wider">Último contacto</span>
        <span className="text-[10px] font-mono text-[#334155]">
          {device.last_seen ? formatRelativeTime(device.last_seen) : 'Nunca'}
        </span>
      </div>
    </div>
  )
}
