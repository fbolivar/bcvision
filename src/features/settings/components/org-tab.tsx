'use client'

import { Building2, Server, Clock, CreditCard, Upload, Trash2, Palette, Tag, Loader2, CheckCircle } from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

interface Org {
  id: string
  name: string
  slug: string
  plan: string
  max_devices: number
  retention_days: number
}

interface OrgSettings {
  brand_name:  string | null
  brand_color: string | null
  logo_url:    string | null
}

interface Props {
  org: Org | null
  isAdmin: boolean
}

const planLabels: Record<string, { label: string; color: string }> = {
  cortesia:    { label: 'Cortesía',    color: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30' },
  basico:      { label: 'Básico',      color: 'text-[#64748b] bg-[#64748b]/10 border-[#64748b]/30' },
  profesional: { label: 'Profesional', color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
  empresarial: { label: 'Empresarial', color: 'text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/30' },
  // legacy
  free:         { label: 'Free',         color: 'text-[#6b7280] bg-[#374151]/50 border-[#0f2038]' },
  professional: { label: 'Professional', color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
  enterprise:   { label: 'Enterprise',   color: 'text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/30' },
}

// ─── Branding section (admin only) ───────────────────────────
function BrandingSection({ orgId }: { orgId: string }) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [settings,  setSettings]  = useState<OrgSettings>({ brand_name: null, brand_color: '#3b82f6', logo_url: null })
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [err,       setErr]       = useState('')
  const [dragging,  setDragging]  = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/org-settings')
    if (res.ok) {
      const d = await res.json()
      setSettings({
        brand_name:  d.brand_name  ?? '',
        brand_color: d.brand_color ?? '#3b82f6',
        logo_url:    d.logo_url    ?? null,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function uploadLogo(file: File) {
    setUploading(true); setErr('')
    const form = new FormData()
    form.append('file', file)
    const res  = await fetch('/api/org-settings/logo', { method: 'POST', body: form })
    const json = await res.json()
    if (!res.ok) setErr(json.error ?? 'Error subiendo logo')
    else setSettings(s => ({ ...s, logo_url: json.logo_url }))
    setUploading(false)
  }

  async function deleteLogo() {
    setUploading(true); setErr('')
    const res = await fetch('/api/org-settings/logo', { method: 'DELETE' })
    if (res.ok) setSettings(s => ({ ...s, logo_url: null }))
    else setErr('Error eliminando logo')
    setUploading(false)
  }

  async function saveBranding() {
    setSaving(true); setErr(''); setSaved(false)
    const res = await fetch('/api/org-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_name:  settings.brand_name || null,
        brand_color: settings.brand_color,
      }),
    })
    const json = await res.json()
    if (!res.ok) setErr(json.error ?? 'Error guardando')
    else setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) uploadLogo(f)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) uploadLogo(f)
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-5 flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-[#475569]" />
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-[#3b82f6]" />
        <h3 className="text-sm font-semibold text-white">Marca e Identidad</h3>
        <span className="text-[10px] text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-0.5 rounded-full font-semibold ml-1">
          Reportes PDF · Emails · Alertas
        </span>
      </div>

      {/* Logo upload */}
      <div>
        <p className="text-xs text-[#6b7280] mb-3">Logo de organización (PNG, JPG, WebP o SVG · máx. 2 MB)</p>
        <div className="flex items-start gap-4">
          {/* Drop zone */}
          <div
            className={`relative w-28 h-28 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden shrink-0 ${
              dragging
                ? 'border-[#3b82f6] bg-[#3b82f6]/10'
                : 'border-[#1e3a5f] hover:border-[#3b82f6]/50 bg-[#060a12]/80'
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-[#3b82f6] animate-spin" />
            ) : settings.logo_url ? (
              <Image
                src={settings.logo_url}
                alt="Logo organización"
                fill
                className="object-contain p-2"
                unoptimized
              />
            ) : (
              <div className="text-center">
                <Upload className="w-6 h-6 text-[#475569] mx-auto mb-1" />
                <span className="text-[10px] text-[#475569]">Subir logo</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
              <Upload className="w-3.5 h-3.5" />
              {settings.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {settings.logo_url && (
              <button
                onClick={deleteLogo}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium text-[#f87171] hover:text-[#ef4444] px-3 py-2 rounded-lg hover:bg-[#ef4444]/10 transition-colors disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar logo
              </button>
            )}
            <p className="text-[11px] text-[#334155]">
              Aparecerá en la portada, header y footer de todos los PDFs,
              y en los emails de alertas y reportes.
            </p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          className="hidden" onChange={onFileChange} />
      </div>

      {/* Brand name */}
      <div>
        <label className="flex items-center gap-1.5 text-xs text-[#9ca3af] mb-1.5">
          <Tag className="w-3.5 h-3.5" />
          Nombre de marca (aparece en PDFs si no hay logo)
        </label>
        <input
          type="text"
          maxLength={80}
          placeholder={`Ej: ${''}`}
          value={settings.brand_name ?? ''}
          onChange={e => setSettings(s => ({ ...s, brand_name: e.target.value }))}
          className="w-full bg-[#060a12]/80 border border-[#1e3a5f] text-white placeholder:text-[#334155] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>

      {/* Brand color */}
      <div>
        <label className="flex items-center gap-1.5 text-xs text-[#9ca3af] mb-1.5">
          <Palette className="w-3.5 h-3.5" />
          Color de acento en reportes PDF
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.brand_color ?? '#3b82f6'}
            onChange={e => setSettings(s => ({ ...s, brand_color: e.target.value }))}
            className="w-10 h-10 rounded-lg border border-[#1e3a5f] bg-transparent cursor-pointer p-0.5"
          />
          <input
            type="text"
            maxLength={7}
            value={settings.brand_color ?? '#3b82f6'}
            onChange={e => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setSettings(s => ({ ...s, brand_color: v }))
            }}
            className="w-32 bg-[#060a12]/80 border border-[#1e3a5f] text-white font-mono rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3b82f6] transition-colors"
          />
          <div className="flex gap-1.5">
            {['#3b82f6','#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#a78bfa'].map(c => (
              <button key={c}
                onClick={() => setSettings(s => ({ ...s, brand_color: c }))}
                className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                style={{ backgroundColor: c, borderColor: settings.brand_color === c ? 'white' : 'transparent' }}
              />
            ))}
          </div>
        </div>
      </div>

      {err && <p className="text-[#f87171] text-xs">{err}</p>}

      <button
        onClick={saveBranding}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
        {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar marca'}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export function OrgTab({ org, isAdmin }: Props) {
  if (!org) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6b7280] text-sm">
        No se encontró la organización
      </div>
    )
  }

  const plan = planLabels[org.plan] ?? planLabels.basico

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Organización</h2>
        <p className="text-sm text-[#6b7280]">Información y configuración de tu organización</p>
      </div>

      {/* Org info */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#3b82f6]" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{org.name}</div>
            <div className="text-xs text-[#6b7280] font-mono mt-0.5">{org.slug}</div>
          </div>
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${plan.color}`}>
            {plan.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Server,     label: 'Dispositivos máx.', value: org.max_devices.toString() },
            { icon: Clock,      label: 'Retención de logs', value: `${org.retention_days} días` },
            { icon: CreditCard, label: 'Plan',              value: plan.label },
          ].map(s => (
            <div key={s.label} className="bg-[#060a12]/80 rounded-xl p-4">
              <s.icon className="w-4 h-4 text-[#6b7280] mb-2" />
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-xs text-[#6b7280] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Branding — solo admins */}
      {isAdmin && <BrandingSection orgId={org.id} />}

      {/* Syslog config */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Configuración Syslog</h3>
        <p className="text-xs text-[#6b7280] mb-4">
          Apunta tus firewalls a este servidor para ingestar logs en tiempo real.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Protocolo UDP', value: 'Puerto 514 (RFC 3164 / RFC 5424)' },
            { label: 'Protocolo TCP', value: 'Puerto 514 (stream)' },
            { label: 'Fabricantes',  value: 'Fortinet · Cisco ASA · pfSense · Sophos · Palo Alto · MikroTik · Genérico' },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2 border-b border-[#2d3148] last:border-0">
              <span className="text-xs text-[#9ca3af]">{r.label}</span>
              <span className="text-xs text-white font-mono">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <p className="text-xs text-[#4b5563] text-center">
          Solo los administradores pueden modificar la configuración de la organización.
        </p>
      )}
    </div>
  )
}
