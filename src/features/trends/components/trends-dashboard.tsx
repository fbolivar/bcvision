'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, BarChart3, Shield, AlertTriangle, Activity } from 'lucide-react'

interface DayStat {
  date:    string
  total:   number
  blocked: number
  threats: number
  bytes:   number
}

interface TrendsData {
  series:  DayStat[]
  days:    number
  totals:  { total: number; blocked: number; threats: number; bytes: number }
  trends:  { total: number; blocked: number; threats: number }
  comparison: {
    period1: { label: string; total: number; blocked: number; threats: number }
    period2: { label: string; total: number; blocked: number; threats: number }
  }
}

const PERIODS = [
  { value: 30,  label: '30 días' },
  { value: 90,  label: '90 días' },
  { value: 180, label: '180 días' },
]

function TrendBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="flex items-center gap-1 text-xs text-[#475569]"><Minus className="w-3 h-3" />Sin cambio</span>
  const up = pct > 0
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-[#f87171]' : 'text-[#4ade80]'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{pct}%
    </span>
  )
}

function MiniChart({ series, field, color }: { series: DayStat[]; field: keyof DayStat; color: string }) {
  if (!series.length) return null
  const values = series.map(d => d[field] as number)
  const max    = Math.max(...values, 1)
  const W = 280, H = 60, pts = values.length

  const points = values.map((v, i) => {
    const x = pts === 1 ? W / 2 : (i / (pts - 1)) * W
    const y = H - (v / max) * (H - 4)
    return `${x},${y}`
  }).join(' ')

  const area = `M0,${H} L${points.split(' ').map((p, i) => {
    const [x] = p.split(',')
    return `${x},${values[i] ? H - (values[i] / max) * (H - 4) : H}`
  }).join(' L')} L${W},${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 mt-2">
      <defs>
        <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${field})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ComparisonBar({ p1, p2, label1, label2, color }: { p1: number; p2: number; label1: string; label2: string; color: string }) {
  const max    = Math.max(p1, p2, 1)
  const pct1   = Math.round((p1 / max) * 100)
  const pct2   = Math.round((p2 / max) * 100)
  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-[#475569] w-28 truncate">{label1}</span>
        <div className="flex-1 h-5 bg-[#0a1225] rounded-md overflow-hidden">
          <div className="h-full rounded-md transition-all" style={{ width: `${pct1}%`, backgroundColor: `${color}55` }} />
        </div>
        <span className="text-xs font-mono text-[#475569] w-16 text-right">{p1.toLocaleString('es-CO')}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-[#475569] w-28 truncate">{label2}</span>
        <div className="flex-1 h-5 bg-[#0a1225] rounded-md overflow-hidden">
          <div className="h-full rounded-md transition-all" style={{ width: `${pct2}%`, backgroundColor: color }} />
        </div>
        <span className="text-xs font-mono text-white w-16 text-right">{p2.toLocaleString('es-CO')}</span>
      </div>
    </div>
  )
}

function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

export function TrendsDashboard() {
  const [period,  setPeriod]  = useState(30)
  const [data,    setData]    = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trends?period=${p}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(period) }, [period, load])

  const kpis = data ? [
    { label: 'Eventos totales',       value: data.totals.total.toLocaleString('es-CO'),   trend: data.trends.total,   color: '#60a5fa', icon: Activity,      field: 'total'   as keyof DayStat },
    { label: 'Eventos bloqueados',    value: data.totals.blocked.toLocaleString('es-CO'),  trend: data.trends.blocked, color: '#f87171', icon: Shield,        field: 'blocked' as keyof DayStat },
    { label: 'Amenazas detectadas',   value: data.totals.threats.toLocaleString('es-CO'),  trend: data.trends.threats, color: '#fbbf24', icon: AlertTriangle,  field: 'threats' as keyof DayStat },
    { label: 'Tráfico analizado',     value: fmtBytes(data.totals.bytes),                  trend: 0,                   color: '#a78bfa', icon: BarChart3,      field: 'bytes'   as keyof DayStat },
  ] : []

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#475569]">Comparación de actividad entre períodos</p>
        <div className="flex gap-1 glass rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.value ? 'bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30' : 'text-[#475569] hover:text-white'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="glass rounded-2xl p-5 h-32 animate-pulse bg-[#0d1a2e]" />)}
        </div>
      ) : (
        <>
          {/* KPI cards with mini charts */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  <TrendBadge pct={kpi.trend} />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{kpi.value}</p>
                <p className="text-[10px] text-[#475569] mt-0.5">{kpi.label}</p>
                {data && <MiniChart series={data.series} field={kpi.field} color={kpi.color} />}
              </div>
            ))}
          </div>

          {/* Comparison section */}
          {data && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-4 h-4 text-[#475569]" />
                <h2 className="text-sm font-bold text-white">Comparación de mitades del período</h2>
                <span className="text-xs text-[#334155] ml-auto">↑ rojo = más actividad · ↓ verde = mejora</span>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-3">Eventos totales</p>
                  <ComparisonBar p1={data.comparison.period1.total} p2={data.comparison.period2.total}
                    label1={data.comparison.period1.label} label2={data.comparison.period2.label} color="#60a5fa" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-3">Bloqueados</p>
                  <ComparisonBar p1={data.comparison.period1.blocked} p2={data.comparison.period2.blocked}
                    label1={data.comparison.period1.label} label2={data.comparison.period2.label} color="#f87171" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-3">Amenazas</p>
                  <ComparisonBar p1={data.comparison.period1.threats} p2={data.comparison.period2.threats}
                    label1={data.comparison.period1.label} label2={data.comparison.period2.label} color="#fbbf24" />
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {data && data.series.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-4">Actividad diaria — {period} días</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#334155] border-b border-[#0f2038]">
                      <th className="text-left py-2 font-medium">Fecha</th>
                      <th className="text-right py-2 font-medium">Total</th>
                      <th className="text-right py-2 font-medium">Bloqueados</th>
                      <th className="text-right py-2 font-medium">Amenazas</th>
                      <th className="text-right py-2 font-medium">Tráfico</th>
                      <th className="py-2 pl-3">Actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.series.slice().reverse().map((d, i) => {
                      const maxTotal = Math.max(...data.series.map(x => x.total), 1)
                      const pct = Math.round((d.total / maxTotal) * 100)
                      return (
                        <tr key={d.date} className={`border-b border-[#0a1628] ${i % 2 === 0 ? '' : 'bg-[#060a12]/40'}`}>
                          <td className="py-2 font-mono text-[#475569]">{d.date}</td>
                          <td className="py-2 text-right text-white">{d.total.toLocaleString('es-CO')}</td>
                          <td className="py-2 text-right text-[#f87171]">{d.blocked.toLocaleString('es-CO')}</td>
                          <td className="py-2 text-right text-[#fbbf24]">{d.threats.toLocaleString('es-CO')}</td>
                          <td className="py-2 text-right text-[#a78bfa] font-mono">{fmtBytes(d.bytes)}</td>
                          <td className="py-2 pl-3">
                            <div className="w-24 h-3 bg-[#0a1225] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
