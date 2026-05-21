'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] p-6 mesh-bg">
      <div className="glass rounded-2xl p-10 text-center max-w-md w-full border border-[#ef4444]/20"
        style={{ boxShadow: '0 0 40px rgba(239,68,68,0.08)' }}>
        <div className="w-14 h-14 rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-[#ef4444]" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Algo salió mal</h2>
        <p className="text-[#64748b] text-sm mb-6 leading-relaxed">
          {error.message || 'Error inesperado al cargar esta sección.'}
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
