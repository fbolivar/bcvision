import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  variant?: 'default' | 'critical' | 'success' | 'warning' | 'purple' | 'cyan'
}

const variantConfig = {
  default:  { card: 'card-blue',   icon: 'text-[#60a5fa]', glow: 'rgba(59,130,246,0.15)',  accent: '#3b82f6' },
  critical: { card: 'card-red',    icon: 'text-[#f87171]', glow: 'rgba(239,68,68,0.15)',   accent: '#ef4444' },
  success:  { card: 'card-green',  icon: 'text-[#4ade80]', glow: 'rgba(34,197,94,0.15)',   accent: '#22c55e' },
  warning:  { card: 'card-amber',  icon: 'text-[#fbbf24]', glow: 'rgba(245,158,11,0.15)',  accent: '#f59e0b' },
  purple:   { card: 'card-purple', icon: 'text-[#a78bfa]', glow: 'rgba(139,92,246,0.15)', accent: '#8b5cf6' },
  cyan:     { card: 'card-cyan',   icon: 'text-[#22d3ee]', glow: 'rgba(6,182,212,0.15)',  accent: '#06b6d4' },
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const cfg = variantConfig[variant]

  return (
    <div className={`${cfg.card} rounded-2xl p-5 border relative overflow-hidden hover-card group`}
      style={{ transition: 'box-shadow 0.3s ease' }}>
      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-30 blur-xl transition-opacity group-hover:opacity-50"
        style={{ background: `radial-gradient(circle, ${cfg.accent}40 0%, transparent 70%)` }} />

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)` }} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white tabular-nums leading-none">{value}</p>
          {subtitle && <p className="mt-1.5 text-xs text-[#475569]">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${cfg.accent}18`, boxShadow: `0 0 16px ${cfg.glow}` }}>
          <Icon className={`w-5 h-5 ${cfg.icon}`} />
        </div>
      </div>

      {trend && (
        <div className="relative mt-4 pt-3 border-t border-[#0f2038] flex items-center gap-1.5">
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trend.value >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
            <span>{trend.value >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </span>
          <span className="text-xs text-[#334155]">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
