'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }
    // Verificar rol para redirigir al lugar correcto
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const destination = profile?.role === 'super_admin' ? '/admin' : '/dashboard'
    router.push(destination)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md animate-scale-in">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center glow-blue overflow-hidden">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L28 6.8V17C28 23.8 22.5 29.2 16 31C9.5 29.2 4 23.8 4 17V6.8L16 2Z" fill="white" fillOpacity="0.18"/>
            <path d="M8 17Q16 9.5 24 17Q16 24.5 8 17Z" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="16" cy="17" r="4.5" fill="white"/>
            <circle cx="16" cy="17" r="2.2" fill="#3b82f6"/>
          </svg>
        </div>
        <span className="font-bold text-white text-lg">BC<span className="text-[#3b82f6]">Vision</span></span>
      </div>

      {/* Glass card */}
      <div className="glass rounded-2xl p-8 relative overflow-hidden">
        {/* Gradient corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#3b82f6]/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#8b5cf6]/8 to-transparent rounded-tr-full" />

        <div className="relative">
          {/* Header */}
          <div className="mb-7">
            <div className="text-xs font-semibold text-[#3b82f6] uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-[#3b82f6]" />
              Acceso seguro
            </div>
            <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
            <p className="text-[#64748b] text-sm mt-1">Accede a tu centro de comando de seguridad</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-fade-in">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0 animate-glow-pulse" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  required
                  autoComplete="email"
                  className="input-cyber w-full rounded-xl px-4 py-3 pl-10 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-cyber w-full rounded-xl px-4 py-3 pl-10 pr-11 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#64748b] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>


            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1e2d3d]" />
            <span className="text-xs text-[#334155]">o</span>
            <div className="flex-1 h-px bg-[#1e2d3d]" />
          </div>

          <p className="text-center text-sm text-[#64748b]">
            ¿Sin cuenta?{' '}
            <Link href="/signup" className="text-[#3b82f6] hover:text-[#60a5fa] font-semibold transition-colors">
              Crear organización →
            </Link>
          </p>
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 mt-5 text-xs text-[#334155]">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Conexión cifrada TLS 1.3 · Supabase Auth
      </div>
    </div>
  )
}
