'use client'

import { useState } from 'react'
import { Download, Clock, CheckCircle, AlertCircle, Loader2, Sparkles, Trash2, X } from 'lucide-react'

interface Report {
  id: string
  title: string
  type: 'executive' | 'technical' | 'compliance'
  status: 'generating' | 'ready' | 'failed'
  period_start: string
  period_end: string
  created_at: string
  generated_at: string | null
  content_json: {
    metrics?: { summary?: { total_events?: number; threat_events?: number; blocked_events?: number } }
    ai_narrative?: { executive_summary?: string } | null
  } | null
}

interface Props {
  report: Report
  onDeleted: (id: string) => void
}

const typeColors = {
  executive:  'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30',
  technical:  'text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/30',
  compliance: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30',
}

const typeLabels = { executive: 'Ejecutivo', technical: 'Técnico', compliance: 'Cumplimiento' }

export function ReportCard({ report, onDeleted }: Props) {
  const metrics    = report.content_json?.metrics?.summary
  const hasSummary = !!report.content_json?.ai_narrative?.executive_summary
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDownloadPdf() {
    const res = await fetch(`/api/reports/${report.id}/pdf`)
    if (!res.ok) return
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `reporte-${report.type}-${report.period_start}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch('/api/reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: report.id }),
    })
    if (res.ok) {
      onDeleted(report.id)
    } else {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="glass border border-[#0f2038] rounded-2xl p-5 hover-card transition-colors relative">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColors[report.type]}`}>
              {typeLabels[report.type]}
            </span>
            {report.status === 'generating' && (
              <span className="flex items-center gap-1 text-xs text-[#f59e0b]">
                <Loader2 className="w-3 h-3 animate-spin" /> Generando...
              </span>
            )}
            {report.status === 'ready' && (
              <span className="flex items-center gap-1 text-xs text-[#22c55e]">
                <CheckCircle className="w-3 h-3" /> Listo
              </span>
            )}
            {report.status === 'failed' && (
              <span className="flex items-center gap-1 text-xs text-[#ef4444]">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            )}
            {hasSummary && (
              <span className="flex items-center gap-1 text-xs text-[#6b7280]">
                <Sparkles className="w-3 h-3 text-[#3b82f6]" /> IA
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white truncate">{report.title}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-[#6b7280]">
            <Clock className="w-3 h-3" />
            {report.period_start} → {report.period_end}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {report.status === 'ready' && (
            <button
              onClick={handleDownloadPdf}
              className="p-2 glass border border-[#0f2038] hover:border-[#1e3a5f] rounded-xl text-[#64748b] hover:text-white transition-all"
              title="Descargar PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 glass border border-[#0f2038] hover:border-[#ef4444]/40 rounded-xl text-[#64748b] hover:text-[#ef4444] transition-all"
            title="Eliminar reporte"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Eventos',    value: metrics.total_events?.toLocaleString('es-CO')   ?? '-' },
            { label: 'Amenazas',   value: metrics.threat_events?.toLocaleString('es-CO')  ?? '-' },
            { label: 'Bloqueados', value: metrics.blocked_events?.toLocaleString('es-CO') ?? '-' },
          ].map(s => (
            <div key={s.label} className="bg-[#060d1a] rounded-xl px-3 py-2 text-center border border-[#0a1628]">
              <div className="text-base font-bold text-white">{s.value}</div>
              <div className="text-xs text-[#6b7280]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmación de eliminación */}
      {confirmDelete && (
        <div className="absolute inset-0 rounded-2xl bg-[#060d1a]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 p-6">
          <div className="w-10 h-10 rounded-full bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">¿Eliminar reporte?</p>
            <p className="text-xs text-[#64748b] mt-1">Esta acción no se puede deshacer</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#64748b] glass border border-[#0f2038] hover:border-[#1e3a5f] transition-all"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#ef4444]/20 border border-[#ef4444]/40 hover:bg-[#ef4444]/30 transition-all disabled:opacity-50"
            >
              {deleting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Eliminando...</>
                : <><Trash2 className="w-3.5 h-3.5" /> Eliminar</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
