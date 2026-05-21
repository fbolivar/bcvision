'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ShieldCheck, Loader2, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function ResetPasswordForm() {
  const router   = useRouter()
  const supabase = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [checking,  setChecking]  = useState(true)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [sessionOk, setSessionOk] = useState(false)

  useEffect(() => {
    let resolved = false

    const resolve = (ok: boolean) => {
      if (resolved) return
      resolved = true
      setSessionOk(ok)
      setChecking(false)
    }

    // onAuthStateChange replica el estado actual a nuevos suscriptores —
    // si el hash ya fue procesado, PASSWORD_RECOVERY / SIGNED_IN dispara igual
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolve(true)
      } else if (event === 'SIGNED_IN' && session) {
        // Flujo hash: Supabase firma al usuario y luego emite PASSWORD_RECOVERY
        // Aquí esperamos un tick más para ver si llega PASSWORD_RECOVERY
        setTimeout(() => resolve(true), 200)
      } else if (event === 'SIGNED_OUT') {
        resolve(false)
      }
    })

    // Timeout de seguridad: si en 10s no llegó ningún evento, mostrar error
    const timeout = setTimeout(() => resolve(false), 10_000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm)  return setError('Las contraseñas no coinciden.')

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) return setError(err.message)
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (checking) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin mx-auto mb-4" />
        <p className="text-[#64748b] text-sm">Verificando enlace...</p>
      </div>
    )
  }

  if (!sessionOk) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Enlace inválido o expirado</h2>
        <p className="text-[#64748b] text-sm mb-6">Solicita un nuevo enlace de recuperación.</p>
        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
          ← Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-7 h-7 text-[#22c55e]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h2>
        <p className="text-[#64748b] text-sm">Redirigiendo al dashboard...</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
        <p className="text-[#64748b] text-sm mt-1">Elige una contraseña segura</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Nueva contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
            <input
              type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres" required minLength={8}
              className="input-cyber w-full rounded-xl px-4 py-3 pl-10 pr-11 text-sm"
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#64748b]">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
            <input
              type={showPw ? 'text' : 'password'} value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la contraseña" required
              className="input-cyber w-full rounded-xl px-4 py-3 pl-10 text-sm"
            />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Actualizando...</>
            : 'Guardar nueva contraseña'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg">BCVision</span>
      </div>
      <div className="glass rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#ef4444]/8 to-transparent rounded-bl-full" />
        <Suspense fallback={<div className="text-center py-8"><Loader2 className="w-6 h-6 text-[#3b82f6] animate-spin mx-auto" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
