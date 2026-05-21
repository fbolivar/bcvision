'use client'

import { useState, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { ReportCard } from './report-card'
import { ReportGenerator } from './report-generator'

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
  initialReports: Report[]
}

export function ReportsList({ initialReports }: Props) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [refreshing, setRefreshing] = useState(false)

  const refreshReports = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports ?? [])
      }
    } finally {
      setRefreshing(false)
    }
  }, [])

  function handleGenerated(_reportId: string) {
    // Poll for new report after a short delay to allow DB write
    setTimeout(refreshReports, 1500)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Generator panel */}
      <div className="xl:col-span-1">
        <ReportGenerator onGenerated={handleGenerated} />
      </div>

      {/* Reports list */}
      <div className="xl:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Reportes Generados</h2>
          <button
            onClick={refreshReports}
            disabled={refreshing}
            className="text-xs text-[#6b7280] hover:text-white transition-colors"
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1a1d2e] border border-[#374151] rounded-xl">
            <FileText className="w-10 h-10 text-[#374151] mb-4" />
            <p className="text-[#6b7280] text-sm">No hay reportes generados</p>
            <p className="text-[#4b5563] text-xs mt-1">Crea el primero con el panel de la izquierda</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map(r => (
              <ReportCard key={r.id} report={r} onDeleted={id => setReports(prev => prev.filter(x => x.id !== id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
