import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Severity } from '@/shared/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

export function severityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: 'text-red-400',
    high:     'text-orange-400',
    medium:   'text-yellow-400',
    low:      'text-blue-400',
    info:     'text-slate-400',
  }
  return map[severity]
}

export function severityBadge(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
    high:     'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    medium:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    low:      'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    info:     'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  }
  return map[severity]
}

export function actionColor(action: string | null): string {
  if (!action) return 'text-slate-400'
  if (action === 'allow' || action === 'monitor') return 'text-green-400'
  return 'text-red-400'
}

export function truncateIp(ip: string | null): string {
  return ip ?? '—'
}

export function protocolLabel(proto: string | null): string {
  if (!proto) return '—'
  return proto.toUpperCase()
}
