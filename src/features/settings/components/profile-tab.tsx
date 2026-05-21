'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, AlertCircle, Mail, Phone, Globe, Bell, BellOff } from 'lucide-react'

interface Props {
  user: { id: string; email: string }
  profile: {
    id: string
    full_name: string | null
    role: string
    email: string
    phone?: string | null
    timezone?: string | null
    notif_email?: boolean | null
    notif_alerts?: boolean | null
    avatar_url?: string | null
  }
}

const roleLabels: Record<string, string> = {
  admin:   'Administrador',
  analyst: 'Analista',
  viewer:  'Observador',
}

const roleColors: Record<string, string> = {
  admin:   'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#60a5fa]',
  analyst: 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-[#a78bfa]',
  viewer:  'bg-[#64748b]/10 border-[#64748b]/30 text-[#94a3b8]',
}

const TIMEZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Caracas',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'UTC',
]

function inputClass(disabled = false) {
  return `w-full px-3 py-2.5 rounded-xl text-sm transition-colors outline-none
    ${disabled
      ? 'bg-[#060a12] border border-[#0f2038] text-[#334155] cursor-not-allowed'
      : 'bg-[#060a12] border border-[#0f2038] text-white placeholder-[#334155] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30'
    }`
}

export function ProfileTab({ user, profile }: Props) {
  const [fullName,     setFullName]     = useState(profile.full_name ?? '')
  const [phone,        setPhone]        = useState(profile.phone ?? '')
  const [timezone,     setTimezone]     = useState(profile.timezone ?? 'America/Bogota')
  const [notifEmail,   setNotifEmail]   = useState(profile.notif_email ?? true)
  const [notifAlerts,  setNotifAlerts]  = useState(profile.notif_alerts ?? true)

  const [loading,   setLoading]   = useState(false)
  const [status,    setStatus]    = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')

  // Email change flow
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [newEmail,        setNewEmail]        = useState('')
  const [emailLoading,    setEmailLoading]    = useState(false)
  const [emailStatus,     setEmailStatus]     = useState<'idle' | 'sent' | 'error'>('idle')
  const [emailError,      setEmailError]      = useState('')

  const initials = (fullName || user.email)
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  async function handleSave() {
    setLoading(true)
    setStatus('idle')
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({
        full_name:    fullName.trim() || null,
        phone:        phone.trim()    || null,
        timezone,
        notif_email:  notifEmail,
        notif_alerts: notifAlerts,
      })
      .eq('id', user.id)

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    }
    setLoading(false)
  }

  async function handleEmailChange() {
    if (!newEmail.includes('@')) {
      setEmailError('Email inválido')
      return
    }
    setEmailLoading(true)
    setEmailError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) {
      setEmailStatus('error')
      setEmailError(error.message)
    } else {
      setEmailStatus('sent')
    }
    setEmailLoading(false)
  }

  function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-[#0a1628] last:border-0">
        <div>
          <p className="text-sm text-white">{label}</p>
          <p className="text-xs text-[#334155] mt-0.5">{sub}</p>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-[#3b82f6]' : 'bg-[#0f2038]'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Avatar + identidad */}
      <div className="glass rounded-2xl p-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-2xl font-bold text-white shrink-0 select-none shadow-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white truncate">{fullName || 'Sin nombre'}</p>
          <p className="text-xs text-[#475569] mt-0.5 truncate">{user.email}</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${roleColors[profile.role] ?? roleColors.viewer}`}>
              {roleLabels[profile.role] ?? profile.role}
            </span>
            {phone && (
              <span className="text-[10px] text-[#334155] flex items-center gap-1">
                <Phone className="w-3 h-3" /> {phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Información personal</h3>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Nombre completo</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Tu nombre completo"
            className={inputClass()}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Teléfono</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+57 300 000 0000"
              className={`${inputClass()} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Zona horaria</span>
          </label>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className={`${inputClass()} appearance-none cursor-pointer`}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz} className="bg-[#060a12]">{tz}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={user.email}
              disabled
              className={`${inputClass(true)} flex-1`}
            />
            <button
              onClick={() => setShowEmailChange(v => !v)}
              className="px-3 py-2.5 rounded-xl text-xs font-medium text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 transition-colors whitespace-nowrap"
            >
              Cambiar
            </button>
          </div>
        </div>

        {/* Email change form */}
        {showEmailChange && (
          <div className="bg-[#060a12] border border-[#1e3a5f] rounded-xl p-4 space-y-3">
            <p className="text-xs text-[#475569]">
              Se enviará un enlace de confirmación al nuevo email. El cambio se aplica al confirmar desde ambos correos.
            </p>
            {emailStatus === 'sent' ? (
              <div className="flex items-center gap-2 text-[#4ade80] text-sm">
                <CheckCircle className="w-4 h-4" />
                Enlace enviado a <strong>{newEmail}</strong>. Revisa tu bandeja.
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="nuevo@email.com"
                  className={inputClass()}
                />
                {emailError && <p className="text-xs text-[#ef4444]">{emailError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleEmailChange}
                    disabled={emailLoading || !newEmail}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    {emailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Enviar enlace de confirmación
                  </button>
                  <button
                    onClick={() => { setShowEmailChange(false); setEmailStatus('idle'); setNewEmail('') }}
                    className="px-4 py-2 rounded-lg text-xs text-[#475569] hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Rol</label>
          <input
            value={roleLabels[profile.role] ?? profile.role}
            disabled
            className={inputClass(true)}
          />
          <p className="text-[10px] text-[#1e3a5f] mt-1">El rol lo asigna el administrador de la organización</p>
        </div>

        {/* Feedback */}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-[#f87171] text-sm bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg || 'Error al guardar. Intenta de nuevo.'}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === 'saved' ? (
            <CheckCircle className="w-4 h-4" />
          ) : null}
          {status === 'saved' ? '¡Guardado correctamente!' : 'Guardar cambios'}
        </button>
      </div>

      {/* Notificaciones */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#475569]" />
          <h3 className="text-sm font-bold text-white">Notificaciones</h3>
        </div>
        <Toggle
          value={notifAlerts}
          onChange={v => { setNotifAlerts(v); setStatus('idle') }}
          label="Alertas de seguridad"
          sub="Recibir notificaciones de alertas críticas y altas"
        />
        <Toggle
          value={notifEmail}
          onChange={v => { setNotifEmail(v); setStatus('idle') }}
          label="Notificaciones por email"
          sub="Resumen diario de eventos y alertas por correo"
        />
        <p className="text-[10px] text-[#1e3a5f] mt-3">
          Los cambios de notificación se guardan con el botón <strong className="text-[#334155]">Guardar cambios</strong> de arriba.
        </p>
      </div>

    </div>
  )
}
