'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ShieldCheck, User, Building2, Mail, Lock, CheckCircle } from 'lucide-react'

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      setLoading(false)
      return
    }
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, orgName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al crear la cuenta.'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#06b6d4]" />
          <div className="w-16 h-16 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-5 glow-green">
            <CheckCircle className="w-8 h-8 text-[#22c55e]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">¡Revisa tu email!</h2>
          <p className="text-[#64748b] text-sm leading-relaxed">
            Enviamos un enlace de confirmación a{' '}
            <span className="text-white font-medium">{email}</span>.
            <br />Confirma tu cuenta para acceder a FirewallIQ.
          </p>
          <Link href="/login" className="inline-flex items-center gap-1.5 mt-6 text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-medium">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center glow-blue">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg">FirewallIQ</span>
      </div>

      <div className="glass rounded-2xl p-8 relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#8b5cf6]/8 to-transparent rounded-bl-full" />

        <div className="relative">
          <div className="mb-6">
            <div className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-[#8b5cf6]" />
              Nuevo acceso
            </div>
            <h1 className="text-2xl font-bold text-white">Registrar organización</h1>
            <p className="text-[#64748b] text-sm mt-1">Conecta tus firewalls en minutos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-fade-in">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]" />
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Juan Pérez" required
                    className="input-cyber w-full rounded-xl px-3 py-2.5 pl-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Organización</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]" />
                  <input
                    type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                    placeholder="Mi Empresa" required
                    className="input-cyber w-full rounded-xl px-3 py-2.5 pl-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Email corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@empresa.com" required autoComplete="email"
                  className="input-cyber w-full rounded-xl px-4 py-3 pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password"
                  className="input-cyber w-full rounded-xl px-4 py-3 pl-10 pr-11 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#64748b] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              <div className="flex gap-1 mt-1">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    password.length === 0 ? 'bg-[#1e2d3d]' :
                    password.length < 6  ? (i < 1 ? 'bg-red-500' : 'bg-[#1e2d3d]') :
                    password.length < 8  ? (i < 2 ? 'bg-yellow-500' : 'bg-[#1e2d3d]') :
                    password.length < 12 ? (i < 3 ? 'bg-blue-500' : 'bg-[#1e2d3d]') :
                    'bg-green-500'
                  }`} />
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creando cuenta...</> : <>
                <ShieldCheck className="w-4 h-4" />Crear cuenta gratuita
              </>}
            </button>

            <p className="text-xs text-[#334155] text-center">
              Al registrarte aceptas los{' '}
              <span className="text-[#64748b] hover:text-[#94a3b8] cursor-pointer transition-colors">Términos de Servicio</span>
            </p>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#1e2d3d]" />
            <span className="text-xs text-[#334155]">ya tienes cuenta?</span>
            <div className="flex-1 h-px bg-[#1e2d3d]" />
          </div>

          <Link href="/login" className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1e2d3d] text-sm text-[#64748b] hover:text-white hover:border-[#3b82f6]/40 transition-all">
            Iniciar sesión →
          </Link>
        </div>
      </div>
    </div>
  )
}
