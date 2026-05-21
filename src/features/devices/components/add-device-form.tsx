'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { createDevice } from '@/features/devices/services/devices.service'
import type { FirewallBrand } from '@/shared/types/database'
import { cn } from '@/shared/lib/utils'

const BRANDS: { value: FirewallBrand; label: string }[] = [
  { value: 'fortinet',  label: 'Fortinet FortiGate' },
  { value: 'cisco',     label: 'Cisco ASA' },
  { value: 'pfsense',   label: 'pfSense' },
  { value: 'sophos',    label: 'Sophos XG' },
  { value: 'paloalto',  label: 'Palo Alto Networks' },
  { value: 'mikrotik',  label: 'MikroTik RouterOS' },
  { value: 'generic',   label: 'Genérico (RFC 3164/5424)' },
]

interface AddDeviceFormProps {
  orgId: string
}

export function AddDeviceForm({ orgId }: AddDeviceFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', ip_address: '', brand: 'fortinet' as FirewallBrand, model: '', location: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await createDevice(orgId, form)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setForm({ name: '', ip_address: '', brand: 'fortinet', model: '', location: '' })
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar dispositivo
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-[#2d3148]">
          <h2 className="text-white font-semibold">Agregar dispositivo firewall</h2>
          <p className="text-slate-500 text-xs mt-1">Registra el firewall para que el listener lo reconozca por IP</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Nombre del dispositivo</label>
            <input
              type="text" required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="FW-Principal"
              className="w-full bg-[#242736] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">IP del firewall</label>
            <input
              type="text" required
              value={form.ip_address}
              onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
              placeholder="192.168.1.1"
              pattern="^(\d{1,3}\.){3}\d{1,3}$"
              className="w-full bg-[#242736] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Fabricante</label>
            <select
              value={form.brand}
              onChange={e => setForm(f => ({ ...f, brand: e.target.value as FirewallBrand }))}
              className="w-full bg-[#242736] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            >
              {BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Modelo (opcional)</label>
              <input
                type="text"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                placeholder="FortiGate 60F"
                className="w-full bg-[#242736] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Ubicación (opcional)</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Sede principal"
                className="w-full bg-[#242736] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-[#2d3148] transition-colors border border-[#2d3148]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
