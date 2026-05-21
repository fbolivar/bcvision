'use client'

import { useState, useEffect } from 'react'

const FIREWALL_BRANDS = ['FortiGate', 'Cisco ASA', 'pfSense', 'SonicWall', 'Palo Alto', 'Check Point']

function TypingBrand() {
  const [idx, setIdx]     = useState(0)
  const [text, setText]   = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const brand = FIREWALL_BRANDS[idx]
    const timeout = setTimeout(() => {
      if (!deleting && text.length < brand.length) {
        setText(brand.slice(0, text.length + 1))
      } else if (!deleting && text.length === brand.length) {
        setTimeout(() => setDeleting(true), 1800)
      } else if (deleting && text.length > 0) {
        setText(text.slice(0, -1))
      } else if (deleting && text.length === 0) {
        setDeleting(false)
        setIdx((i) => (i + 1) % FIREWALL_BRANDS.length)
      }
    }, deleting ? 60 : 90)
    return () => clearTimeout(timeout)
  }, [text, deleting, idx])

  return (
    <span className="text-[#3b82f6]">
      {text}<span className="animate-[blink_0.8s_step-end_infinite] text-[#3b82f6]">|</span>
    </span>
  )
}

function FloatingAlert({ style, delay, icon, title, sub, accent }: {
  style: string; delay: string; icon: string; title: string; sub: string; accent: string
}) {
  return (
    <div className={`absolute ${style} glass-card px-4 py-3 rounded-xl text-sm w-64 shadow-xl`}
      style={{ animationDelay: delay }}>
      <div className="flex items-start gap-2.5">
        <span className="text-base mt-0.5">{icon}</span>
        <div>
          <p className={`font-bold text-xs ${accent}`}>{title}</p>
          <p className="text-[#94a3b8] text-[11px] mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  )
}

interface HeroFormProps { onSuccess: () => void }

function HeroForm({ onSuccess }: HeroFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', devices: '' })
  const [err, setErr] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.company) { setErr('Completa todos los campos requeridos'); return }
    setLoading(true); setErr('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const j = await res.json(); setErr(j.error ?? 'Error enviando solicitud') }
      else onSuccess()
    } catch { setErr('Error de conexión') }
    finally { setLoading(false) }
  }

  const inputCls = 'w-full bg-[#0a1628] border border-[#1e3a5f] text-white placeholder:text-[#334155] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Tu nombre *" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className={inputCls} placeholder="Empresa *" value={form.company}
          onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
      </div>
      <input className={inputCls} type="email" placeholder="Email corporativo *" value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      <select className={`${inputCls} cursor-pointer`} value={form.devices}
        onChange={e => setForm(f => ({ ...f, devices: e.target.value }))}>
        <option value="">¿Cuántos firewalls/dispositivos? (opcional)</option>
        <option value="1-5">1 – 5 dispositivos</option>
        <option value="6-20">6 – 20 dispositivos</option>
        <option value="21-50">21 – 50 dispositivos</option>
        <option value="51+">Más de 50 dispositivos</option>
      </select>

      {err && <p className="text-[#f87171] text-xs">{err}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] disabled:opacity-60 transition-all shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]">
        {loading ? 'Enviando...' : '🚀 Solicitar Demo Gratuita'}
      </button>
      <p className="text-[10px] text-[#334155] text-center">
        Sin tarjeta de crédito · Respuesta en menos de 24 horas
      </p>
    </form>
  )
}

function SuccessState() {
  return (
    <div className="text-center py-8 space-y-3">
      <div className="w-16 h-16 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-white font-bold text-lg">¡Demo solicitada!</h3>
      <p className="text-[#94a3b8] text-sm">Nuestro equipo te contactará en menos de 24 horas para agendar tu demo personalizada.</p>
      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
        <span className="text-[#22c55e] text-xs font-semibold">Tu solicitud está en cola</span>
      </div>
    </div>
  )
}

export function LandingHero() {
  const [success, setSuccess] = useState(false)

  return (
    <section id="demo" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Animated cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#3b82f6]/8 blur-[100px] float-orb pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#6366f1]/8 blur-[100px] float-orb-2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#06b6d4]/5 blur-[80px] float-orb-3 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-xs font-semibold text-[#3b82f6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping inline-block" />
              Nueva plataforma · Análisis en tiempo real
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              <span className="text-white">La próxima amenaza</span><br />
              <span className="text-white">ya está en tu red.</span><br />
              <span className="bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
                ¿La verías?
              </span>
            </h1>

            <p className="text-[#94a3b8] text-lg leading-relaxed max-w-xl">
              BCVision convierte los logs de tu{' '}
              <TypingBrand />{' '}
              en inteligencia accionable. Dashboard en tiempo real, alertas automáticas y reportes ejecutivos — sin necesitar un SOC de 10 personas.
            </p>

            {/* Trust chips */}
            <div className="flex flex-wrap gap-2">
              {['PCI DSS', 'ISO 27001', 'FortiGate', 'Cisco ASA', 'pfSense', 'SonicWall'].map(b => (
                <span key={b} className="text-xs px-3 py-1 rounded-full bg-[#0a1628] border border-[#1e3a5f] text-[#475569] font-medium">
                  {b}
                </span>
              ))}
            </div>

            {/* Mini stats */}
            <div className="flex gap-6 pt-2">
              {[
                { n: '+50K', label: 'eventos/día' },
                { n: '<2 min', label: 'detección' },
                { n: '99.9%', label: 'uptime' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.n}</p>
                  <p className="text-xs text-[#475569]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form card */}
          <div className="relative">
            {/* Floating alert cards (decorative, behind form) */}
            <div className="hidden xl:block absolute -top-8 -right-4 glass-card px-4 py-3 rounded-xl w-60 float-card-1 z-10 shadow-xl">
              <div className="flex items-start gap-2">
                <span>⚡</span>
                <div>
                  <p className="text-[#f87171] font-bold text-xs">Amenaza bloqueada</p>
                  <p className="text-[#94a3b8] text-[11px]">Conexión C2 detectada · 192.168.1.45</p>
                </div>
              </div>
            </div>
            <div className="hidden xl:block absolute -bottom-4 -left-8 glass-card px-4 py-3 rounded-xl w-64 float-card-2 z-10 shadow-xl">
              <div className="flex items-start gap-2">
                <span>✅</span>
                <div>
                  <p className="text-[#22c55e] font-bold text-xs">Compliance PCI DSS</p>
                  <p className="text-[#94a3b8] text-[11px]">98/100 controles · Actualizado ahora</p>
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="glass-card-bright rounded-2xl p-6 border-glow">
              <div className="mb-5">
                <h2 className="text-white font-bold text-xl">Solicita tu demo gratuita</h2>
                <p className="text-[#475569] text-sm mt-1">
                  Descubre cómo BCVision protege tu infraestructura
                </p>
              </div>
              {success ? <SuccessState /> : <HeroForm onSuccess={() => setSuccess(true)} />}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#334155] animate-bounce">
        <span className="text-xs font-medium">Descubre más</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  )
}
