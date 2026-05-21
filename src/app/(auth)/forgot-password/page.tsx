'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ShieldCheck, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (!res.ok) { setError('Error al procesar la solicitud.'); return }
    setSent(true)
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg">BCVision</span>
      </div>

      <div className="glass rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#3b82f6]/10 to-transparent rounded-bl-full" />

        {sent ? (
          <div className="text-center py-4 relative">
            <div className="w-14 h-14 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-[#22c55e]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Revisa tu correo</h2>
            <p className="text-[#64748b] text-sm leading-relaxed mb-6">
              Si <span className="text-white font-medium">{email}</span> está registrado,
              recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
              <ArrowLeft className="w-4 h-4" />Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <div className="relative">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Recuperar contraseña</h1>
              <p className="text-[#64748b] text-sm mt-1">Te enviaremos un enlace a tu correo</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@empresa.com" required
                    className="input-cyber w-full rounded-xl px-4 py-3 pl-10 text-sm"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#94a3b8] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />Volver al inicio de sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
