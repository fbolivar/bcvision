'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Shield, Activity, AlertTriangle,
  Users, Monitor, FileText, Settings, LogOut, ChevronRight,
  Wifi, AppWindow, ShieldAlert, TrendingUp, Building2, Sliders,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const monitoringItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, color: '#3b82f6' },
  { href: '/traffic',      label: 'Tráfico',       icon: Activity,        color: '#06b6d4' },
  { href: '/threats',      label: 'Amenazas',      icon: Shield,          color: '#ef4444' },
  { href: '/users-net',    label: 'Usuarios red',  icon: Users,           color: '#8b5cf6' },
  { href: '/vpn',          label: 'VPN',           icon: Wifi,            color: '#10b981' },
  { href: '/applications', label: 'Aplicaciones',  icon: AppWindow,       color: '#f59e0b' },
  { href: '/security',     label: 'Inteligencia',  icon: ShieldAlert,     color: '#ec4899' },
  { href: '/devices',      label: 'Dispositivos',  icon: Monitor,         color: '#22c55e' },
  { href: '/alerts',       label: 'Alertas',       icon: AlertTriangle,   color: '#f97316' },
  { href: '/reports',      label: 'Reportes',      icon: FileText,        color: '#a78bfa' },
  { href: '/trends',       label: 'Tendencias',    icon: TrendingUp,      color: '#34d399' },
]

const msspItems = [
  { href: '/admin',        label: 'Panel MSSP',       icon: Building2,  color: '#a78bfa' },
  { href: '/org-settings', label: 'Config. avanzada', icon: Sliders,    color: '#34d399' },
  { href: '/settings',     label: 'Ajustes',          icon: Settings,   color: '#64748b' },
]

const systemItems = [
  { href: '/settings',     label: 'Ajustes',          icon: Settings,   color: '#64748b', roles: ['admin','analyst','viewer'] },
  { href: '/org-settings', label: 'Config. avanzada', icon: Sliders,    color: '#34d399', roles: ['admin'] },
]

function NavLink({ href, label, icon: Icon, color, badge }: {
  href: string; label: string; icon: React.ElementType; color: string; badge?: React.ReactNode
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative overflow-hidden',
        active ? 'text-white' : 'text-[#475569] hover:text-[#94a3b8]'
      )}
      style={active ? {
        background: `linear-gradient(90deg, ${color}18 0%, ${color}08 100%)`,
        borderLeft: `2px solid ${color}`,
      } : {}}
    >
      {!active && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, ${color}08 0%, transparent 100%)` }} />
      )}
      <Icon className="w-4 h-4 flex-shrink-0 relative z-10 transition-all duration-200"
        style={{ color: active ? color : undefined }} />
      <span className="relative z-10 font-medium">{label}</span>
      {badge}
      {active && <ChevronRight className="ml-auto w-3 h-3 relative z-10" style={{ color }} />}
    </Link>
  )
}

export function Sidebar({ role = 'viewer' }: { role?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const isMssp = role === 'super_admin'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #060d1a 0%, #080f1c 100%)', borderRight: '1px solid #0f2038' }}>

      <div className="absolute inset-0 grid-pattern-sm opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-[#3b82f6]/10 blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="relative px-5 py-5 border-b border-[#0f2038]">
        <Link href={isMssp ? '/admin' : '/dashboard'} className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center transition-all duration-300 group-hover:glow-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-[#3b82f6]/30 to-[#8b5cf6]/30 blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight">FirewallIQ</div>
            <div className="text-[9px] tracking-widest uppercase font-medium" style={{ color: isMssp ? '#a78bfa' : '#334155' }}>
              {isMssp ? 'MSSP Admin' : 'Security Platform'}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto relative">

        {isMssp ? (
          /* ── Sidebar MSSP (super_admin) ── */
          <>
            <p className="px-3 mb-3 text-[9px] font-bold uppercase tracking-widest text-[#1e3a5f]">
              Gestión MSSP
            </p>
            {msspItems.map(item => <NavLink key={item.href} {...item} />)}

            <div className="pt-4">
              <div className="mx-3 mb-3 p-3 rounded-xl border border-[#a78bfa]/20 bg-[#8b5cf6]/5">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-3 h-3 text-[#a78bfa]" />
                  <span className="text-xs font-semibold text-[#a78bfa]">Proveedor MSSP</span>
                </div>
                <div className="text-[10px] text-[#475569]">Acceso total · Todos los clientes</div>
              </div>
            </div>
          </>
        ) : (
          /* ── Sidebar cliente (admin / analyst / viewer) ── */
          <>
            <p className="px-3 mb-3 text-[9px] font-bold uppercase tracking-widest text-[#1e3a5f]">
              Monitoreo
            </p>
            {monitoringItems.map(item => (
              <NavLink
                key={item.href}
                {...item}
                badge={item.href === '/alerts' ? (
                  <span className="ml-auto relative z-10 flex items-center gap-1 text-[9px] bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25 rounded px-1.5 py-0.5 font-bold">
                    <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-pulse" />
                    LIVE
                  </span>
                ) : undefined}
              />
            ))}

            <div className="pt-4">
              <p className="px-3 mb-3 text-[9px] font-bold uppercase tracking-widest text-[#1e3a5f]">
                Sistema
              </p>
              {systemItems
                .filter(item => item.roles.includes(role))
                .map(item => <NavLink key={item.href} {...item} />)
              }
            </div>

            {/* Status indicator */}
            <div className="mt-4 p-3 rounded-xl border border-[#0f2038] bg-[#060d1a]">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
                </span>
                <span className="text-xs font-semibold text-[#22c55e]">Sistemas operativos</span>
              </div>
              <div className="text-[10px] text-[#334155]">Syslog · IA · Alertas activos</div>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-[#0f2038] pt-3">
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#475569] hover:text-[#ef4444] transition-all duration-200 hover:bg-[#ef4444]/8"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
