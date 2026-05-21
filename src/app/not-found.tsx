import Link from 'next/link'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060a12] mesh-bg flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-12 text-center max-w-md w-full border border-[#1e3a5f]">
        <div className="text-6xl font-black gradient-text mb-4">404</div>
        <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-7 h-7 text-[#3b82f6]" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Página no encontrada</h2>
        <p className="text-[#64748b] text-sm mb-6">La ruta que buscas no existe o fue movida.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Home className="w-4 h-4" />
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
