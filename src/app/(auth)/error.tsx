'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-6 mesh-bg">
      <div className="glass rounded-2xl p-10 text-center max-w-sm w-full border border-[#ef4444]/20">
        <AlertTriangle className="w-8 h-8 text-[#ef4444] mx-auto mb-4" />
        <h2 className="text-white font-bold mb-2">Error de autenticación</h2>
        <p className="text-[#64748b] text-sm mb-6">{error.message || 'Ocurrió un error inesperado.'}</p>
        <button onClick={reset} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl text-sm font-semibold transition-colors">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    </div>
  )
}
