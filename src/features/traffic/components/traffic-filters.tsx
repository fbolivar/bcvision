'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'

const PROTOCOLS  = ['TCP','UDP','ICMP','HTTPS','HTTP','DNS','GRE','ESP']
const ACTIONS    = ['allow','deny','drop','reset','monitor']
const SEVERITIES = ['critical','high','medium','low','info']

const selectClass = 'input-cyber rounded-xl px-3 py-2 text-xs font-medium outline-none appearance-none cursor-pointer'
const FILTER_KEYS = ['protocol','action','severity','src_ip','dst_ip','search']

export function TrafficFilters() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  // Controlled state for text inputs — avoids per-keystroke navigation
  const [srcIp, setSrcIp] = useState(params.get('src_ip') ?? '')
  const [dstIp, setDstIp] = useState(params.get('dst_ip') ?? '')

  // Sync inputs when URL params change (e.g. coming from topbar search or clear)
  useEffect(() => { setSrcIp(params.get('src_ip') ?? '') }, [params])
  useEffect(() => { setDstIp(params.get('dst_ip') ?? '') }, [params])

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value); else next.delete(key)
    next.set('page', '1')
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  // Only navigate on Enter or blur — avoids rapid-fire navigations
  const commitSrcIp = () => update('src_ip', srcIp)
  const commitDstIp = () => update('dst_ip', dstIp)

  const clear = () => router.push(pathname)
  const hasFilters = FILTER_KEYS.some(k => params.has(k))
  const activeCount = FILTER_KEYS.filter(k => params.has(k)).length

  // Show current search query from topbar if present
  const currentSearch = params.get('search') ?? ''

  return (
    <div className="glass rounded-2xl p-4 border-[#0f2038]">
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#334155] uppercase tracking-widest mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 text-[#60a5fa] rounded-full border border-[#3b82f6]/30">
              {activeCount}
            </span>
          )}
        </div>

        {/* Búsqueda global (desde topbar) */}
        {currentSearch && (
          <div className="flex items-center gap-2 input-cyber rounded-xl px-3 py-2 border border-[#3b82f6]/40 bg-[#3b82f6]/8">
            <Search className="w-3 h-3 text-[#3b82f6] shrink-0" />
            <span className="text-xs text-[#60a5fa]">&ldquo;{currentSearch}&rdquo;</span>
            <button onClick={() => update('search', '')} className="text-[#334155] hover:text-[#ef4444] transition-colors ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* IP origen */}
        <div className="flex items-center gap-2 input-cyber rounded-xl px-3 py-2 min-w-[150px]">
          <Search className="w-3 h-3 text-[#334155] shrink-0" />
          <input
            type="text"
            placeholder="IP origen..."
            value={srcIp}
            onChange={e => setSrcIp(e.target.value)}
            onBlur={commitSrcIp}
            onKeyDown={e => e.key === 'Enter' && commitSrcIp()}
            className="bg-transparent text-xs text-[#94a3b8] placeholder-[#334155] outline-none w-full"
          />
        </div>

        {/* IP destino */}
        <div className="flex items-center gap-2 input-cyber rounded-xl px-3 py-2 min-w-[150px]">
          <Search className="w-3 h-3 text-[#334155] shrink-0" />
          <input
            type="text"
            placeholder="IP destino..."
            value={dstIp}
            onChange={e => setDstIp(e.target.value)}
            onBlur={commitDstIp}
            onKeyDown={e => e.key === 'Enter' && commitDstIp()}
            className="bg-transparent text-xs text-[#94a3b8] placeholder-[#334155] outline-none w-full"
          />
        </div>

        <select value={params.get('protocol') ?? ''} onChange={e => update('protocol', e.target.value)} className={selectClass}>
          <option value="">Protocolo</option>
          {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={params.get('action') ?? ''} onChange={e => update('action', e.target.value)} className={selectClass}>
          <option value="">Acción</option>
          {ACTIONS.map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
        </select>

        <select value={params.get('severity') ?? ''} onChange={e => update('severity', e.target.value)} className={selectClass}>
          <option value="">Severidad</option>
          {SEVERITIES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#ef4444] bg-[#ef4444]/8 border border-[#ef4444]/20 hover:bg-[#ef4444]/15 transition-colors">
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
