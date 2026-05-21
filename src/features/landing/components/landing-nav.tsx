'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M14 2L4 6.5V14C4 19.52 8.4 24.7 14 26C19.6 24.7 24 19.52 24 14V6.5L14 2Z" fill="url(#shieldGrad)" />
    <path d="M10 14l2.5 2.5L18 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="shieldGrad" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
  </svg>
)

interface LandingNavProps { isLoggedIn: boolean }

export function LandingNav({ isLoggedIn }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'mx-4 mt-3 rounded-2xl bg-[#050d1a]/80 backdrop-blur-xl border border-[#1e3a5f]/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <ShieldIcon />
          <span className="font-black text-xl tracking-tight text-white">
            BC<span className="text-[#3b82f6]">Vision</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94a3b8]">
          <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-white transition-colors">Precios</a>
          <a href="#mssp" className="hover:text-white transition-colors">Para MSSP</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#3b82f6] hover:bg-[#2563eb] px-4 py-2 rounded-xl transition-colors">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="hidden md:block text-sm font-medium text-[#94a3b8] hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <a href="#demo"
                className="text-sm font-semibold text-white bg-[#3b82f6] hover:bg-[#2563eb] px-4 py-2 rounded-xl transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                Solicitar Demo
              </a>
            </>
          )}
          <button className="md:hidden text-[#94a3b8] p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen
                ? <><path d="M18 6L6 18M6 6l12 12"/></>
                : <><path d="M4 6h16M4 12h16M4 18h16"/></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1e3a5f]/40 px-5 py-4 flex flex-col gap-4 text-sm font-medium">
          <a href="#caracteristicas" onClick={() => setMobileOpen(false)} className="text-[#94a3b8] hover:text-white">Características</a>
          <a href="#como-funciona" onClick={() => setMobileOpen(false)} className="text-[#94a3b8] hover:text-white">Cómo funciona</a>
          <a href="#precios" onClick={() => setMobileOpen(false)} className="text-[#94a3b8] hover:text-white">Precios</a>
          <a href="#demo" onClick={() => setMobileOpen(false)}
            className="text-center text-white bg-[#3b82f6] px-4 py-2.5 rounded-xl">
            Solicitar Demo Gratis
          </a>
        </div>
      )}
    </nav>
  )
}
