'use client'

import { Bell, Search, ChevronDown, Zap, X, User, LogOut, Settings, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TopbarProps {
  title: string
  subtitle?: string
}

interface AlertNotif {
  id: string
  title: string
  severity: string
  created_at: string
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#3b82f6',
  info:     '#64748b',
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const notifsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifs, setNotifs] = useState<AlertNotif[]>([])
  const [notifsLoaded, setNotifsLoaded] = useState(false)
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  // Load user info once
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserEmail(user.email ?? '')
      supabase.from('users').select('full_name').eq('id', user.id).single().then(({ data }) => {
        setUserName(data?.full_name ?? '')
      })
    })
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowNotifs(false)
        setShowUserMenu(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Click outside to close dropdowns
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifs = useCallback(async () => {
    if (notifsLoaded || notifsLoading) return
    setNotifsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (profile) {
        const { data } = await supabase
          .from('alerts')
          .select('id, title, severity, created_at')
          .eq('org_id', profile.org_id)
          .in('status', ['open', 'acknowledged'])
          .order('created_at', { ascending: false })
          .limit(6)
        setNotifs((data ?? []) as AlertNotif[])
      }
    }
    setNotifsLoaded(true)
    setNotifsLoading(false)
  }, [notifsLoaded, notifsLoading])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/traffic?search=${encodeURIComponent(searchQuery.trim())}`)
    setShowSearch(false)
    setSearchQuery('')
  }

  const initials = userName
    ? userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : userEmail.charAt(0).toUpperCase() || 'U'

  const unreadCount = notifs.filter(n => n.severity === 'critical' || n.severity === 'high').length

  return (
    <>
      <header
        className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-20 relative"
        style={{ background: 'rgba(6, 10, 18, 0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #0f2038' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/30 to-transparent" />

        {/* Title */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3b82f6]" />
            <h1 className="text-base font-bold text-white">{title}</h1>
          </div>
          {subtitle && <p className="text-xs text-[#334155] mt-0.5">{subtitle}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search trigger */}
          <button
            onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50) }}
            className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-52 bg-[#060d1a] border border-[#0f2038] hover:border-[#1e3a5f] transition-all duration-200 text-left"
          >
            <Search className="w-3.5 h-3.5 text-[#334155]" />
            <span className="text-xs text-[#334155] flex-1">Buscar eventos, IPs...</span>
            <kbd className="hidden lg:block text-[9px] text-[#1e3a5f] bg-[#0f2038] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-[#22c55e] bg-[#22c55e]/8 border border-[#22c55e]/20 px-3 py-1.5 rounded-lg">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e]" />
            </span>
            <span className="font-semibold">En vivo</span>
          </div>

          {/* Notifications */}
          <div ref={notifsRef} className="relative">
            <button
              onClick={() => { setShowNotifs(v => !v); if (!showNotifs) loadNotifs() }}
              className="relative p-2 rounded-xl text-[#475569] hover:text-white transition-all duration-200 hover:bg-[#0f2038] group"
            >
              <Bell className="w-4 h-4 group-hover:animate-glow-pulse" />
              {(!notifsLoaded || notifs.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ef4444] rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl border border-[#1e3a5f] shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#0f2038] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alertas activas</span>
                  <Link href="/alerts" onClick={() => setShowNotifs(false)} className="text-xs text-[#3b82f6] hover:underline">Ver todas</Link>
                </div>
                {notifsLoading ? (
                  <div className="px-4 py-6 text-center text-xs text-[#334155]">Cargando...</div>
                ) : notifs.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Bell className="w-6 h-6 text-[#1e3a5f] mx-auto mb-2" />
                    <p className="text-xs text-[#334155]">Sin alertas activas</p>
                  </div>
                ) : (
                  <div>
                    {notifs.map(n => (
                      <Link
                        key={n.id}
                        href="/alerts"
                        onClick={() => setShowNotifs(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-[#060d1a] border-b border-[#0a1628] last:border-0 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: SEVERITY_COLOR[n.severity] ?? '#64748b' }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white font-medium truncate">{n.title}</p>
                          <p className="text-[10px] text-[#334155] mt-0.5">
                            {new Date(n.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold shrink-0" style={{ color: SEVERITY_COLOR[n.severity] ?? '#64748b' }}>
                          {n.severity}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-[#0f2038] hover:border-[#1e3a5f] transition-all bg-[#060d1a] hover:bg-[#0a1628] group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[11px] font-bold text-white">
                {initials}
              </div>
              <ChevronDown className={`w-3 h-3 text-[#334155] group-hover:text-[#64748b] transition-all duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl border border-[#1e3a5f] shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#0f2038]">
                  <p className="text-xs font-bold text-white truncate">{userName || 'Usuario'}</p>
                  <p className="text-[10px] text-[#334155] mt-0.5 truncate">{userEmail}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#94a3b8] hover:text-white hover:bg-[#060d1a] transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Mi perfil
                  </Link>
                  <Link
                    href="/settings?tab=security"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#94a3b8] hover:text-white hover:bg-[#060d1a] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configuración
                  </Link>
                  <div className="border-t border-[#0a1628] my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#ef4444] hover:bg-[#ef4444]/8 transition-colors w-full text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="glass rounded-2xl w-full max-w-lg mx-4 border border-[#1e3a5f] overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(59,130,246,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3.5">
              <Search className="w-4 h-4 text-[#3b82f6] shrink-0" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por IP, tipo de evento..."
                className="flex-1 bg-transparent text-white text-sm placeholder-[#334155] outline-none"
                autoFocus
              />
              <button type="button" onClick={() => setShowSearch(false)}>
                <X className="w-4 h-4 text-[#334155] hover:text-[#64748b] transition-colors" />
              </button>
            </form>
            <div className="border-t border-[#0f2038] px-4 py-2.5 flex gap-4">
              <span className="text-[10px] text-[#334155]">
                <kbd className="bg-[#0f2038] px-1.5 py-0.5 rounded font-mono text-[#475569] mr-1">Enter</kbd>
                buscar en tráfico
              </span>
              <span className="text-[10px] text-[#334155]">
                <kbd className="bg-[#0f2038] px-1.5 py-0.5 rounded font-mono text-[#475569] mr-1">Esc</kbd>
                cerrar
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
