'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    id:         'cortesia',
    name:       'Cortesía',
    price:      0,
    period:     'Para siempre',
    color:      '#22c55e',
    desc:       'Ideal para explorar BCVision sin riesgo.',
    devices:    5,
    retention:  '30 días',
    features: [
      'Hasta 5 dispositivos',
      'Dashboard en tiempo real',
      'Alertas básicas por email',
      'Reportes PDF básicos',
      'Soporte comunitario',
    ],
    cta:    'Empezar gratis',
    ctaUrl: '/signup',
    badge:  null,
  },
  {
    id:         'basico',
    name:       'Básico',
    price:      350000,
    period:     'mes',
    color:      '#64748b',
    desc:       'Para PYMEs con 1 sede y equipo de TI pequeño.',
    devices:    5,
    retention:  '30 días',
    features: [
      'Hasta 5 dispositivos',
      'Dashboard completo',
      'Alertas inteligentes',
      'Reportes PDF ejecutivos',
      'Exportación CSV',
      'Soporte por email',
    ],
    cta:    'Solicitar demo',
    ctaUrl: '#demo',
    badge:  null,
  },
  {
    id:         'profesional',
    name:       'Profesional',
    price:      900000,
    period:     'mes',
    color:      '#3b82f6',
    desc:       'El favorito de empresas medianas con múltiples sedes.',
    devices:    20,
    retention:  '90 días',
    features: [
      'Hasta 20 dispositivos',
      'Todo lo de Básico',
      'Compliance PCI DSS & ISO 27001',
      'Análisis de tendencias 90 días',
      'Reportes programados (cron)',
      'Notificaciones avanzadas',
      'Soporte prioritario',
    ],
    cta:    'Solicitar demo',
    ctaUrl: '#demo',
    badge:  'Más popular',
    popular: true,
  },
  {
    id:         'empresarial',
    name:       'Empresarial',
    price:      2500000,
    period:     'mes',
    color:      '#a78bfa',
    desc:       'Para grandes organizaciones y proveedores MSSP.',
    devices:    999,
    retention:  '365 días',
    features: [
      'Dispositivos ilimitados',
      'Todo lo de Profesional',
      'White-label (tu marca en PDFs)',
      'API REST completa',
      'Gestión multi-cliente MSSP',
      'SLA dedicado 99.9%',
      'Onboarding personalizado',
    ],
    cta:    'Hablar con ventas',
    ctaUrl: '#demo',
    badge:  null,
  },
]

function formatCOP(n: number) {
  if (n === 0) return '$0'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

export function LandingPricing() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <section id="precios" className="py-20">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14">
          <p className="text-[#3b82f6] text-sm font-bold uppercase tracking-widest mb-3">Precios transparentes</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Elige el plan que{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#a78bfa] bg-clip-text text-transparent">
              se adapta a tu empresa
            </span>
          </h2>
          <p className="text-[#94a3b8] mt-4">
            Todos los planes incluyen actualizaciones automáticas · Precios en COP + IVA
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANS.map(plan => {
            const isHovered  = hoveredId === plan.id
            const isPopular  = !!plan.popular
            return (
              <div key={plan.id}
                onMouseEnter={() => setHoveredId(plan.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 ${
                  isPopular
                    ? 'bg-[#0f1f3d] border-2 scale-[1.02] shadow-[0_0_40px_rgba(59,130,246,0.2)]'
                    : 'glass-card hover:border-[#1e3a5f]'
                }`}
                style={{ borderColor: isPopular ? plan.color : isHovered ? `${plan.color}40` : undefined }}>

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${plan.color}, #6366f1)` }}>
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="font-black text-white text-lg">{plan.name}</span>
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-black text-white">
                      {plan.price === 0 ? 'Gratis' : formatCOP(plan.price)}
                    </span>
                    {plan.price > 0 && <span className="text-[#475569] text-sm mb-1">/{plan.period}</span>}
                  </div>
                  {plan.price === 0 && (
                    <p className="text-xs text-[#475569]">{plan.period}</p>
                  )}
                  <p className="text-[#94a3b8] text-xs mt-2 leading-relaxed">{plan.desc}</p>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                    style={{ color: plan.color, background: `${plan.color}12`, border: `1px solid ${plan.color}20` }}>
                    {plan.devices === 999 ? '∞ dispositivos' : `${plan.devices} dispositivos`}
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#0a1628] border border-[#1e3a5f] text-[#475569] font-semibold">
                    {plan.retention} retención
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: plan.color }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a href={plan.ctaUrl}
                  className="block text-center py-3 rounded-xl font-bold text-sm transition-all"
                  style={isPopular ? {
                    background: `linear-gradient(135deg, ${plan.color}, #6366f1)`,
                    color: 'white',
                    boxShadow: `0 0 20px ${plan.color}35`,
                  } : {
                    background: `${plan.color}12`,
                    color: plan.color,
                    border: `1px solid ${plan.color}30`,
                  }}>
                  {plan.cta}
                </a>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[#334155] text-xs mt-8">
          ¿Necesitas un plan a medida para tu MSSP? →{' '}
          <a href="#demo" className="text-[#3b82f6] hover:underline font-medium">Hablemos</a>
        </p>
      </div>
    </section>
  )
}

// ─── Footer CTA ──────────────────────────────────────────────
export function LandingFooterCTA() {
  return (
    <>
      {/* CTA Banner */}
      <section className="py-20 relative overflow-hidden bg-[#030810]">
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3b82f6]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center space-y-6">
          <p className="text-[#3b82f6] text-sm font-bold uppercase tracking-widest">¿Listo para empezar?</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Visibilidad total.<br />
            <span className="bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
              Control absoluto.
            </span>
          </h2>
          <p className="text-[#94a3b8] text-lg">
            Únete a las empresas colombianas que ya protegen su red con inteligencia real.
            Empieza gratis — sin tarjeta de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#demo"
              className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all text-sm">
              Solicitar Demo Gratuita →
            </a>
            <Link href="/signup"
              className="px-8 py-4 rounded-xl font-bold text-[#3b82f6] border border-[#3b82f6]/30 hover:border-[#3b82f6]/60 hover:bg-[#3b82f6]/5 transition-all text-sm">
              Empezar con plan Cortesía
            </Link>
          </div>
          <p className="text-xs text-[#334155]">
            Plan Cortesía gratuito · Sin límite de tiempo · Configura en 10 minutos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0f2038] py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2L4 6.5V14C4 19.52 8.4 24.7 14 26C19.6 24.7 24 19.52 24 14V6.5L14 2Z" fill="url(#footerGrad)" />
                  <path d="M10 14l2.5 2.5L18 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <defs><linearGradient id="footerGrad" x1="4" y1="2" x2="24" y2="26"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs>
                </svg>
                <span className="font-black text-white">BC<span className="text-[#3b82f6]">Vision</span></span>
              </div>
              <p className="text-[#475569] text-xs leading-relaxed">
                Plataforma SaaS de análisis de firewall y ciberseguridad para empresas colombianas.
              </p>
              <p className="text-[#334155] text-xs">© 2025 BC Security · BC Fabric SAS</p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Producto</p>
              <ul className="space-y-2 text-[#475569] text-sm">
                <li><a href="#caracteristicas" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a></li>
                <li><a href="#mssp" className="hover:text-white transition-colors">Para MSSP</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Cumplimiento</p>
              <ul className="space-y-2 text-[#475569] text-sm">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />PCI DSS
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />ISO 27001
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />Ley 1581 (Datos)</li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-3">Contacto</p>
              <ul className="space-y-2 text-[#475569] text-sm">
                <li>📧 ventas@bc-security.com.co</li>
                <li>🇨🇴 Colombia</li>
                <li>
                  <a href="#demo" className="text-[#3b82f6] hover:underline font-medium">Solicitar demo →</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#0a1628] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[#334155] text-xs">
            <span>Construido con Next.js · Supabase · Tailwind CSS</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#94a3b8] transition-colors">Términos</a>
              <a href="#" className="hover:text-[#94a3b8] transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
