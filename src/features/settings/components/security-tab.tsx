'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, KeyRound, LogOut, AlertTriangle } from 'lucide-react'

interface Props {
  email: string
}

export function SecurityTab({ email }: Props) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [signOutLoading, setSignOutLoading] = useState(false)

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setPwError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Las contraseñas no coinciden')
      return
    }
    setPwLoading(true)
    setPwError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwError(error.message)
    } else {
      setPwSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSaved(false), 3000)
    }
    setPwLoading(false)
  }

  async function handleSignOutAll() {
    setSignOutLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Seguridad</h2>
        <p className="text-sm text-[#6b7280]">Gestiona tu contraseña y sesiones activas</p>
      </div>

      {/* Email info */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">Cuenta</div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-[#9ca3af]">Email</span>
          <span className="text-sm text-white font-mono">{email}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-t border-[#2d3148]">
          <span className="text-sm text-[#9ca3af]">Autenticación</span>
          <span className="text-xs px-2 py-0.5 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] rounded-full">Email / Contraseña</span>
        </div>
      </div>

      {/* Change password */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-[#6b7280]" />
          <span className="text-sm font-semibold text-white">Cambiar contraseña</span>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-1.5">
            Nueva contraseña
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full px-3 py-2.5 input-cyber rounded-xl text-white text-sm placeholder-[#4b5563] "
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-1.5">
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
            className="w-full px-3 py-2.5 input-cyber rounded-xl text-white text-sm placeholder-[#4b5563] "
          />
        </div>

        {pwError && <p className="text-sm text-[#ef4444]">{pwError}</p>}

        <button
          onClick={handleChangePassword}
          disabled={pwLoading || !newPassword}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {pwLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : pwSaved
            ? <CheckCircle className="w-4 h-4" />
            : <KeyRound className="w-4 h-4" />}
          {pwSaved ? 'Contraseña actualizada' : 'Actualizar contraseña'}
        </button>
      </div>

      {/* Sign out all */}
      <div className="bg-[#1a1d2e] border border-[#ef4444]/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#ef4444] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-1">Cerrar todas las sesiones</div>
            <p className="text-xs text-[#6b7280] mb-4">
              Cierra sesión en todos los dispositivos donde esté activa tu cuenta. Deberás iniciar sesión nuevamente.
            </p>
            <button
              onClick={handleSignOutAll}
              disabled={signOutLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] font-semibold rounded-lg text-sm transition-colors"
            >
              {signOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Cerrar todas las sesiones
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
