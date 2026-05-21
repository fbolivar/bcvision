'use client'

import { useState } from 'react'
import { FileText, Loader2, Sparkles, Calendar } from 'lucide-react'

type ReportType = 'executive' | 'technical' | 'compliance'

interface GenerateResult {
  report_id: string
  has_ai_narrative: boolean
  metrics_summary: {
    total_events: number
    threats: number
    blocked: number
    period_days: number
  }
}

interface Props {
  onGenerated: (reportId: string) => void
}

const today = new Date().toISOString().slice(0, 10)
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

export function ReportGenerator({ onGenerated }: Props) {
  const [type, setType] = useState<ReportType>('executive')
  const [periodStart, setPeriodStart] = useState(thirtyDaysAgo)
  const [periodEnd, setPeriodEnd] = useState(today)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, period_start: periodStart, period_end: periodEnd, title: title || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error generando reporte')
        return
      }
      setResult(data)
      onGenerated(data.report_id)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const types: { value: ReportType; label: string; desc: string }[] = [
    { value: 'executive', label: 'Ejecutivo', desc: 'Para dirección y gerencia. Lenguaje claro, orientado a decisiones.' },
    { value: 'technical', label: 'Técnico', desc: 'Para equipo IT y SOC. Detalles de amenazas, IPs y protocolos.' },
    { value: 'compliance', label: 'Cumplimiento', desc: 'Para auditoría y regulatorio. Retención de logs y controles.' },
  ]

  return (
    <div className="bg-[#1a1d2e] border border-[#374151] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-[#3b82f6]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Generar Nuevo Reporte</h2>
          <p className="text-xs text-[#6b7280]">Análisis automático con IA · Claude (Anthropic)</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Tipo */}
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
            Tipo de Reporte
          </label>
          <div className="grid grid-cols-3 gap-3">
            {types.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  type === t.value
                    ? 'border-[#3b82f6] bg-[#3b82f6]/10'
                    : 'border-[#374151] bg-[#242736] hover:border-[#4b5563]'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${type === t.value ? 'text-[#3b82f6]' : 'text-white'}`}>
                  {t.label}
                </div>
                <div className="text-xs text-[#6b7280] leading-tight">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
              Inicio del Período
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                max={periodEnd}
                className="w-full pl-9 pr-3 py-2.5 bg-[#242736] border border-[#374151] rounded-lg text-white text-sm focus:outline-none focus:border-[#3b82f6] [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
              Fin del Período
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                min={periodStart}
                max={today}
                className="w-full pl-9 pr-3 py-2.5 bg-[#242736] border border-[#374151] rounded-lg text-white text-sm focus:outline-none focus:border-[#3b82f6] [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Título personalizado (opcional) */}
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
            Título Personalizado <span className="text-[#4b5563] normal-case">(opcional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Se genera automáticamente si no se especifica"
            maxLength={120}
            className="w-full px-3 py-2.5 bg-[#242736] border border-[#374151] rounded-lg text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        {error && (
          <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
            <div className="text-sm font-semibold text-[#22c55e] mb-2">Reporte generado exitosamente</div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Eventos', value: result.metrics_summary.total_events.toLocaleString('es-CO') },
                { label: 'Amenazas', value: result.metrics_summary.threats },
                { label: 'Bloqueados', value: result.metrics_summary.blocked },
                { label: 'Días', value: result.metrics_summary.period_days },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-xs text-[#6b7280]">{s.label}</div>
                </div>
              ))}
            </div>
            {result.has_ai_narrative && (
              <div className="mt-2 text-xs text-[#22c55e] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Narrativa generada con IA
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando con IA...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generar Reporte
            </>
          )}
        </button>
      </div>
    </div>
  )
}
