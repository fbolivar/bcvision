'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Bell, Clock, Shield, Loader2, CheckCircle, AlertCircle, Plus, X, Mail } from 'lucide-react'

interface OrgSettingsProps {
  org: { id: string; name: string; slug: string; plan: string; max_devices: number; retention_days: number } | null
  settings: {
    logo_url?: string | null
    brand_color?: string | null
    brand_name?: string | null
    retention_days?: number | null
    alert_email_enabled?: boolean | null
    alert_email_recipients?: string[] | null
  } | null
  isAdmin: boolean
}

function inputClass(disabled = false) {
  return `w-full px-3 py-2.5 rounded-xl text-sm transition-colors outline-none ${
    disabled
      ? 'bg-[#060a12] border border-[#0f2038] text-[#334155] cursor-not-allowed'
      : 'bg-[#060a12] border border-[#0f2038] text-white placeholder-[#334155] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30'
  }`
}

export function OrgSettingsForm({ org, settings, isAdmin }: OrgSettingsProps) {
  const router = useRouter()

  const [brandName,    setBrandName]    = useState(settings?.brand_name ?? org?.name ?? '')
  const [brandColor,   setBrandColor]   = useState(settings?.brand_color ?? '#3b82f6')
  const [logoUrl,      setLogoUrl]      = useState(settings?.logo_url ?? '')
  const [retention,    setRetention]    = useState(settings?.retention_days ?? org?.retention_days ?? 90)
  const [alertEmail,   setAlertEmail]   = useState(settings?.alert_email_enabled ?? false)
  const [recipients,   setRecipients]   = useState<string[]>(settings?.alert_email_recipients ?? [])
  const [newEmail,     setNewEmail]     = useState('')

  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState<'idle'|'saved'|'error'>('idle')
  const [errMsg,  setErrMsg]  = useState('')

  async function handleSave() {
    setLoading(true); setStatus('idle')
    const res = await fetch('/api/org-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_name:             brandName.trim() || undefined,
        brand_color:            brandColor,
        logo_url:               logoUrl.trim() || null,
        retention_days:         retention,
        alert_email_enabled:    alertEmail,
        alert_email_recipients: recipients,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setStatus('error'); setErrMsg(data.error ?? 'Error al guardar') }
    else         { setStatus('saved'); setTimeout(() => setStatus('idle'), 3000); router.refresh() }
    setLoading(false)
  }

  function addRecipient() {
    if (!newEmail.includes('@') || recipients.includes(newEmail)) return
    setRecipients(r => [...r, newEmail])
    setNewEmail('')
  }

  const RETENTION_OPTIONS = [
    { value: 30,   label: '30 días' },
    { value: 60,   label: '60 días' },
    { value: 90,   label: '90 días (recomendado)' },
    { value: 180,  label: '180 días' },
    { value: 365,  label: '1 año' },
    { value: 730,  label: '2 años (enterprise)' },
  ]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* White-label / Branding */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-[#8b5cf6]" />
          <h3 className="text-sm font-bold text-white">Marca y white-label</h3>
        </div>
        <p className="text-xs text-[#475569]">Estos datos aparecerán en los reportes PDF y emails enviados a tus clientes.</p>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Nombre de marca</label>
          <input value={brandName} onChange={e => setBrandName(e.target.value)} disabled={!isAdmin}
            placeholder="Ej: BC Security · BCVision" className={inputClass(!isAdmin)} />
          <p className="text-[10px] text-[#1e3a5f] mt-1">Aparece en encabezado y pie de reportes PDF</p>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">URL del logo</label>
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} disabled={!isAdmin}
            placeholder="https://tuempresa.com/logo.png" className={inputClass(!isAdmin)} />
          <p className="text-[10px] text-[#1e3a5f] mt-1">PNG o SVG · ancho recomendado 200px · fondo transparente</p>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Color de acento</label>
          <div className="flex items-center gap-3">
            <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} disabled={!isAdmin}
              className="w-10 h-10 rounded-lg border border-[#0f2038] bg-[#060a12] cursor-pointer disabled:cursor-not-allowed p-1" />
            <input value={brandColor} onChange={e => setBrandColor(e.target.value)} disabled={!isAdmin}
              placeholder="#3b82f6" className={`${inputClass(!isAdmin)} font-mono w-36`} />
            <div className="w-8 h-8 rounded-lg border border-[#0f2038]" style={{ backgroundColor: brandColor }} />
          </div>
        </div>
      </div>

      {/* Alertas por email */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-[#fbbf24]" />
          <h3 className="text-sm font-bold text-white">Notificaciones de alertas</h3>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-white">Activar notificaciones por email</p>
            <p className="text-xs text-[#334155] mt-0.5">Recibir email cuando se detecte alerta crítica o alta</p>
          </div>
          <button onClick={() => isAdmin && setAlertEmail(v => !v)} disabled={!isAdmin}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${alertEmail ? 'bg-[#3b82f6]' : 'bg-[#0f2038]'} ${!isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${alertEmail ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {alertEmail && (
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest">Destinatarios</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]" />
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRecipient()}
                  placeholder="destinatario@empresa.com" disabled={!isAdmin}
                  className={`${inputClass(!isAdmin)} pl-9`} />
              </div>
              <button onClick={addRecipient} disabled={!isAdmin || !newEmail}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#60a5fa] hover:bg-[#3b82f6]/20 disabled:opacity-50 transition-colors text-xs">
                <Plus className="w-3.5 h-3.5" />Agregar
              </button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipients.map(r => (
                  <span key={r} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2038] border border-[#1e3a5f] text-xs text-white">
                    <Mail className="w-3 h-3 text-[#475569]" />
                    {r}
                    {isAdmin && (
                      <button onClick={() => setRecipients(rs => rs.filter(x => x !== r))}
                        className="text-[#334155] hover:text-[#f87171] transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retención de logs */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-[#34d399]" />
          <h3 className="text-sm font-bold text-white">Retención de logs</h3>
        </div>
        <p className="text-xs text-[#475569]">Los eventos de firewall más antiguos que el período configurado serán eliminados automáticamente cada semana.</p>

        <div>
          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Período de retención</label>
          <select value={retention} onChange={e => setRetention(parseInt(e.target.value))} disabled={!isAdmin}
            className={`${inputClass(!isAdmin)} appearance-none cursor-pointer`}>
            {RETENTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value} className="bg-[#060a12]">{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#0a1225] rounded-xl border border-[#1e3a5f]">
          <Shield className="w-3.5 h-3.5 text-[#60a5fa] shrink-0 mt-0.5" />
          <p className="text-xs text-[#475569]">
            <strong className="text-[#334155]">PCI DSS</strong> requiere mínimo 12 meses · <strong className="text-[#334155]">ISO 27001</strong> recomenda 1-3 años ·
            Plan Enterprise admite hasta 2 años
          </p>
        </div>
      </div>

      {/* Org info (read-only) */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white mb-3">Información de la organización</h3>
        {[
          { label: 'Slug',           value: org?.slug },
          { label: 'Plan',           value: org?.plan },
          { label: 'Máx. dispositivos', value: String(org?.max_devices ?? '—') },
        ].map(f => (
          <div key={f.label} className="flex items-center justify-between py-1.5 border-b border-[#0a1628] last:border-0">
            <span className="text-xs text-[#475569]">{f.label}</span>
            <span className="text-xs font-mono text-white">{f.value}</span>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-[#f87171] text-sm bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{errMsg}
        </div>
      )}

      {isAdmin && (
        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'saved' ? <CheckCircle className="w-4 h-4" /> : null}
          {status === 'saved' ? '¡Guardado correctamente!' : 'Guardar configuración'}
        </button>
      )}
    </div>
  )
}
