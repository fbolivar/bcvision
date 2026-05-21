interface Segment {
  label: string
  value: number
  color: string
}

interface Props {
  title: string
  data: Segment[]
}

const SIZE   = 160
const RADIUS = 58
const CX     = SIZE / 2
const CY     = SIZE / 2
const CIRC   = 2 * Math.PI * RADIUS

export function DonutChartWidget({ title, data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)

  let offset = 0
  const segments = data.map(d => {
    const pct  = total > 0 ? d.value / total : 0
    const dash = pct * CIRC
    const seg  = { ...d, pct, dash, offset }
    offset += dash
    return seg
  })

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#3b82f6] to-[#8b5cf6]" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
      </div>

      {/* Donut centered */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#0a1628" strokeWidth={16} />
            {total === 0 ? (
              <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#1e3a5f" strokeWidth={16} strokeDasharray={`${CIRC}`} />
            ) : (
              segments.map((s, i) => (
                <circle
                  key={i}
                  cx={CX} cy={CY} r={RADIUS}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={16}
                  strokeDasharray={`${s.dash - 2} ${CIRC}`}
                  strokeDashoffset={-s.offset}
                  style={{ filter: `drop-shadow(0 0 6px ${s.color}80)` }}
                />
              ))
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white leading-none">
              {total > 999 ? `${(total / 1000).toFixed(1)}k` : total > 0 ? total : '—'}
            </span>
            <span className="text-[9px] text-[#334155] uppercase tracking-wider mt-1">total</span>
          </div>
        </div>
      </div>

      {/* Legend grid */}
      {segments.length === 0 ? (
        <p className="text-xs text-[#334155] text-center pb-2">Sin datos en las últimas 24h</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {segments.slice(0, 6).map((s, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }}
              />
              <span className="text-[11px] text-[#64748b] truncate flex-1">{s.label || 'N/A'}</span>
              <span className="text-[11px] font-bold shrink-0" style={{ color: s.color }}>
                {total > 0 ? `${Math.round(s.pct * 100)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
