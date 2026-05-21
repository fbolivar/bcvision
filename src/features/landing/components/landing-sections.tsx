'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Count-up hook ───────────────────────────────────────────
function useCountUp(target: number, duration = 1800, started: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!started) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])
  return value
}

function StatCard({ value, suffix, label, sub }: { value: number; suffix: string; label: string; sub: string }) {
  const ref  = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const count = useCountUp(value, 1600, visible)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl font-black text-white">
        {count.toLocaleString()}<span className="text-[#3b82f6]">{suffix}</span>
      </p>
      <p className="text-sm font-semibold text-white mt-1">{label}</p>
      <p className="text-xs text-[#475569] mt-0.5">{sub}</p>
    </div>
  )
}

// ─── Stats ────────────────────────────────────────────────────
export function LandingStats() {
  return (
    <section className="py-16 border-y border-[#0f2038]">
      <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatCard value={50000}  suffix="+"  label="Eventos analizados/día" sub="por organización activa" />
        <StatCard value={2}      suffix=" min" label="Tiempo de detección"    sub="promedio de alerta" />
        <StatCard value={99}     suffix=".9%" label="Uptime garantizado"      sub="SLA por contrato" />
        <StatCard value={4}      suffix=" planes" label="Desde $0 / mes"      sub="sin tarjeta de crédito" />
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🖥️',
    title: 'Dashboard en Tiempo Real',
    desc: 'Visualiza cada conexión, amenaza y evento de tu red al instante. Mapas de tráfico, top IPs, protocolos y países de origen.',
    accent: '#3b82f6',
    tags: ['Tráfico', 'IPs', 'Protocolos'],
  },
  {
    icon: '⚡',
    title: 'Alertas Inteligentes',
    desc: 'Detección automática de anomalías, ataques de fuerza bruta, C2 y escaneos de red. Notificación por email antes de que escale.',
    accent: '#f59e0b',
    tags: ['Email', 'Webhook', 'Automático'],
  },
  {
    icon: '📊',
    title: 'Reportes Ejecutivos PDF',
    desc: 'Reportes gerenciales y técnicos con un clic. Diseño profesional con logo de tu empresa, métricas clave y resumen de incidentes.',
    accent: '#6366f1',
    tags: ['PDF', 'Programado', 'White-label'],
  },
  {
    icon: '🛡️',
    title: 'Compliance Automático',
    desc: 'Evidencia lista para auditorías PCI DSS e ISO 27001. Controles verificados, brechas identificadas y plan de remediación.',
    accent: '#22c55e',
    tags: ['PCI DSS', 'ISO 27001', 'Auditoría'],
  },
  {
    icon: '📈',
    title: 'Análisis de Tendencias',
    desc: 'Compara periodos de 30 y 90 días. Detecta patrones ocultos, incrementos de tráfico y evolución de amenazas con gráficas comparativas.',
    accent: '#06b6d4',
    tags: ['30 días', '90 días', 'Histórico'],
  },
  {
    icon: '🏢',
    title: 'Gestión Multi-cliente MSSP',
    desc: 'Panel consolidado para gestionar todos tus clientes desde una sola pantalla. Facturación, suscripciones y alertas por organización.',
    accent: '#a78bfa',
    id: 'mssp',
    tags: ['Multi-org', 'Facturación', 'MSSP'],
  },
]

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} id={feature.id}
      className="glass-card rounded-2xl p-6 flex flex-col gap-4 transition-all duration-500 hover:border-[#1e3a5f] hover:shadow-[0_0_30px_rgba(59,130,246,0.08)] group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
      }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: `${feature.accent}15`, border: `1px solid ${feature.accent}25` }}>
        {feature.icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-white text-lg mb-2">{feature.title}</h3>
        <p className="text-[#94a3b8] text-sm leading-relaxed">{feature.desc}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {feature.tags.map(t => (
          <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: feature.accent, backgroundColor: `${feature.accent}12`, border: `1px solid ${feature.accent}20` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

export function LandingFeatures() {
  return (
    <section id="caracteristicas" className="py-20">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14">
          <p className="text-[#3b82f6] text-sm font-bold uppercase tracking-widest mb-3">Características</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Todo lo que necesitas<br />
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
              para dominar tu red
            </span>
          </h2>
          <p className="text-[#94a3b8] mt-4 max-w-xl mx-auto">
            Una plataforma diseñada para equipos de seguridad que necesitan resultados reales, no dashboards vacíos.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Conecta tu firewall',
    desc: 'Configura tu FortiGate, Cisco ASA, pfSense o SonicWall para enviar logs via Syslog a BCVision. Tarda menos de 10 minutos.',
    icon: '🔌',
  },
  {
    num: '02',
    title: 'BCVision analiza en segundos',
    desc: 'El motor de análisis clasifica automáticamente amenazas, tráfico anómalo y eventos de compliance en tiempo real.',
    icon: '⚙️',
  },
  {
    num: '03',
    title: 'Actúa con inteligencia',
    desc: 'Recibe alertas, genera reportes ejecutivos, monitorea compliance y toma decisiones con datos, no suposiciones.',
    icon: '🎯',
  },
]

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="py-20 bg-[#030810]">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-14">
          <p className="text-[#3b82f6] text-sm font-bold uppercase tracking-widest mb-3">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Operativo en <span className="text-[#3b82f6]">menos de 1 hora</span>
          </h2>
        </div>
        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-[#1e3a5f] via-[#3b82f6]/40 to-[#1e3a5f]" />

          {STEPS.map((s, i) => (
            <div key={s.num} className="relative text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-[#0a1628] border border-[#1e3a5f] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                {s.icon}
                <span className="absolute -top-2 -right-2 text-[10px] font-black text-[#3b82f6] bg-[#050d1a] border border-[#3b82f6]/30 rounded-full w-5 h-5 flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg">{s.title}</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
