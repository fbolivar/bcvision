'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  orgId: string
  filters: Record<string, string | undefined>
}

export function ExportButton({ orgId, filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport(format: 'csv' | 'json') {
    setLoading(true)
    const params = new URLSearchParams({ format })
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const res = await fetch(`/api/events/export?${params.toString()}`)
    if (res.ok) {
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `eventos_${new Date().toISOString().slice(0, 10)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleExport('csv')}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 glass border border-[#0f2038] hover:border-[#1e3a5f] text-[#64748b] hover:text-white rounded-lg text-xs transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        CSV
      </button>
      <button
        onClick={() => handleExport('json')}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 glass border border-[#0f2038] hover:border-[#1e3a5f] text-[#64748b] hover:text-white rounded-lg text-xs transition-all disabled:opacity-50"
      >
        <Download className="w-3 h-3" />
        JSON
      </button>
    </div>
  )
}
