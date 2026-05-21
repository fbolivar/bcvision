'use client'

import { useState } from 'react'
import { CalendarClock, Loader2, CheckCircle, Mail, Clock } from 'lucide-react'

const FREQUENCIES = [
  { value: 'daily',   label: 'Diario',   desc: 'Cada día a las 7:00 AM' },
  { value: 'weekly',  label: 'Semanal',  desc: 'Cada lunes a las 7:00 AM' },
  { value: 'monthly', label: 'Mensual',  desc: 'Primero de cada mes' },
]

const REPORT_TYPES = [
  { value: 'executive',   label: 'Ejecutivo' },
  { value: 'technical',   label: 'Técnico' },
  { value: 'compliance',  label: 'Cumplimiento' },
]

export function ScheduleReportForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    report_type: 'executive',
    frequency: 'weekly',
    email: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, include_pdf: false }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al programar reporte')
    } else {
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 2500)
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 glass border border-[#0f2038] hover:border-[#1e3a5f] text-[#64748b] hover:text-white rounded-xl text-sm transition-all"
      >
        <CalendarClock className="w-4 h-4" />
        Programar envío
      </button>
    )
  }

  return (
    <div className="glass rounded-2xl p-5 border border-[#1e3a5f] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#8b5cf6]" />
          <span className="text-sm font-semibold text-white">Programar reporte automático</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-[#334155] hover:text-[#64748b] text-xs">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Report type */}
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">Tipo de reporte</label>
          <div className="grid grid-cols-3 gap-2">
            {REPORT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, report_type: t.value }))}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                  form.report_type === t.value
                    ? 'bg-[#8b5cf6]/15 border-[#8b5cf6]/40 text-[#a78bfa]'
                    : 'bg-transparent border-[#0f2038] text-[#64748b] hover:border-[#1e3a5f]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
            <Clock className="w-3 h-3 inline mr-1" />Frecuencia
          </label>
          <div className="space-y-2">
            {FREQUENCIES.map(f => (
              <label key={f.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                form.frequency === f.value
                  ? 'border-[#3b82f6]/40 bg-[#3b82f6]/8'
                  : 'border-[#0f2038] hover:border-[#1e3a5f]'
              }`}>
                <input
                  type="radio"
                  name="frequency"
                  value={f.value}
                  checked={form.frequency === f.value}
                  onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                  className="accent-[#3b82f6]"
                />
                <div>
                  <div className="text-xs font-semibold text-white">{f.label}</div>
                  <div className="text-[10px] text-[#334155]">{f.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
            <Mail className="w-3 h-3 inline mr-1" />Email de entrega
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="destinatario@empresa.com"
            className="w-full input-cyber rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#4b5563]"
          />
        </div>

        {error && <p className="text-xs text-[#ef4444]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.email}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
          {saved ? 'Programado exitosamente' : 'Programar reporte'}
        </button>
      </form>
    </div>
  )
}
