'use client'

import { LandingNav }           from './components/landing-nav'
import { LandingHero }          from './components/landing-hero'
import { LandingStats, LandingFeatures, LandingHowItWorks } from './components/landing-sections'
import { LandingPricing, LandingFooterCTA } from './components/landing-pricing'

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');

/* ── Reset ──────────────────────────────────────────── */
html { scroll-behavior: smooth }
*, *::before, *::after { box-sizing: border-box }

/* ── Typography ─────────────────────────────────────── */
body { font-family: 'Space Grotesk', system-ui, sans-serif }

/* ── Keyframes ──────────────────────────────────────── */
@keyframes float-orb  { 0%,100%{transform:translateY(0) scale(1)}   50%{transform:translateY(-24px) scale(1.04)} }
@keyframes float-orb2 { 0%,100%{transform:translateY(0) scale(1)}   50%{transform:translateY(18px)  scale(0.97)} }
@keyframes float-orb3 { 0%,100%{transform:translateX(0)}            50%{transform:translateX(-16px)} }
@keyframes float-card1{ 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-8px) rotate(0.5deg)} }
@keyframes float-card2{ 0%,100%{transform:translateY(0) rotate(1deg)}  50%{transform:translateY(8px)  rotate(-0.5deg)} }
@keyframes blink      { 50%{opacity:0} }
@keyframes border-glow{ 0%,100%{box-shadow:0 0 0 1px rgba(59,130,246,0.15), 0 0 20px rgba(59,130,246,0.05)}
                         50%{box-shadow:0 0 0 1px rgba(59,130,246,0.4),  0 0 35px rgba(59,130,246,0.12)} }
@keyframes scan-line  { 0%{top:0;opacity:1} 100%{top:100%;opacity:0} }
@keyframes grid-drift { 0%{transform:translate(0,0)} 100%{transform:translate(60px,60px)} }

/* ── Utility classes ────────────────────────────────── */
.float-orb   { animation: float-orb  7s ease-in-out infinite }
.float-orb-2 { animation: float-orb2 9s ease-in-out infinite }
.float-orb-3 { animation: float-orb3 11s ease-in-out infinite }
.float-card-1{ animation: float-card1 5s ease-in-out infinite }
.float-card-2{ animation: float-card2 6s ease-in-out infinite 1.5s }
.border-glow { animation: border-glow 3s ease-in-out infinite }

/* Glass morphism cards */
.glass-card {
  background: rgba(10,22,40,0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(30,58,95,0.5);
}
.glass-card-bright {
  background: rgba(12,24,48,0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(59,130,246,0.15);
}

/* Cyber grid background */
.cyber-grid {
  background-image:
    linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
  background-size: 60px 60px;
  background-position: center center;
  animation: grid-drift 20s linear infinite;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px }
::-webkit-scrollbar-track { background: #050d1a }
::-webkit-scrollbar-thumb { background: linear-gradient(#3b82f6, #6366f1); border-radius: 3px }
::-webkit-scrollbar-thumb:hover { background: #3b82f6 }

/* Selection */
::selection { background: rgba(59,130,246,0.3); color: white }
`

interface LandingPageProps { isLoggedIn: boolean }

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div className="min-h-screen bg-[#050d1a] text-white overflow-x-hidden">
        <LandingNav    isLoggedIn={isLoggedIn} />
        <LandingHero   />
        <LandingStats  />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFooterCTA />
      </div>
    </>
  )
}
