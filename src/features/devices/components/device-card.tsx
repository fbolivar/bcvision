'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Pencil, Loader2, Check, X } from 'lucide-react'
import { deleteDevice, updateDevice } from '@/features/devices/services/devices.service'
import { DeviceStatusCard } from '@/features/dashboard/components/device-status-card'
import type { Device } from '@/shared/types/database'

export function DeviceCard({ device, canManage = true }: { device: Device; canManage?: boolean }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: device.name, model: device.model ?? '', location: device.location ?? '' })

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await deleteDevice(device.id)
    router.refresh()
  }

  async function handleSave() {
    setSaving(true)
    await updateDevice(device.id, { name: form.name, model: form.model || undefined, location: form.location || undefined })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <DeviceStatusCard device={editing ? { ...device, name: form.name, model: form.model || null, location: form.location || null } : device} />

      {canManage && editing ? (
        <div className="glass rounded-xl p-3 space-y-2 border border-[#1e3a5f]">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nombre"
            className="w-full input-cyber rounded-lg px-3 py-2 text-white text-xs placeholder-[#334155]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.model}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              placeholder="Modelo"
              className="input-cyber rounded-lg px-3 py-2 text-white text-xs placeholder-[#334155]"
            />
            <input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Ubicación"
              className="input-cyber rounded-lg px-3 py-2 text-white text-xs placeholder-[#334155]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Guardar
            </button>
            <button
              onClick={() => { setEditing(false); setForm({ name: device.name, model: device.model ?? '', location: device.location ?? '' }) }}
              className="flex-1 py-1.5 text-[#64748b] hover:text-white border border-[#0f2038] hover:border-[#1e3a5f] rounded-lg text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : canManage ? (
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 glass border border-[#0f2038] hover:border-[#1e3a5f] text-[#64748b] hover:text-white rounded-lg text-xs transition-all"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all ${
              confirmDelete
                ? 'bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] font-semibold'
                : 'glass border border-[#0f2038] hover:border-[#ef4444]/30 text-[#64748b] hover:text-[#ef4444]'
            }`}
            onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
