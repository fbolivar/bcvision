import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/trends?period=30|90|180&org_id=...
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const days    = parseInt(req.nextUrl.searchParams.get('period') ?? '30', 10)
  const since   = new Date(Date.now() - days * 86400000).toISOString()

  // Aggregate events per day
  const { data: dailyRaw } = await supabase
    .from('firewall_events')
    .select('event_time, action, severity, bytes_sent, bytes_received')
    .eq('org_id', profile.org_id)
    .gte('event_time', since)
    .order('event_time', { ascending: true })

  const events = dailyRaw ?? []

  // Group by date
  const byDay: Record<string, { date: string; total: number; blocked: number; threats: number; bytes: number }> = {}

  for (const e of events) {
    const date = e.event_time.slice(0, 10)
    if (!byDay[date]) byDay[date] = { date, total: 0, blocked: 0, threats: 0, bytes: 0 }
    byDay[date].total++
    if (['deny','drop','block','reset'].includes(e.action ?? '')) byDay[date].blocked++
    if (['critical','high'].includes(e.severity)) byDay[date].threats++
    byDay[date].bytes += (e.bytes_sent ?? 0) + (e.bytes_received ?? 0)
  }

  const series = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))

  // Weekly aggregates for comparison
  const half = Math.floor(days / 2)
  const midpoint = new Date(Date.now() - half * 86400000).toISOString().slice(0, 10)
  const firstHalf  = series.filter(d => d.date < midpoint)
  const secondHalf = series.filter(d => d.date >= midpoint)

  function sum<K extends keyof typeof series[0]>(arr: typeof series, key: K) {
    return arr.reduce((acc, d) => acc + (d[key] as number), 0)
  }

  const comparison = {
    period1: { label: `Primeros ${half} días`, total: sum(firstHalf,'total'), blocked: sum(firstHalf,'blocked'), threats: sum(firstHalf,'threats') },
    period2: { label: `Últimos ${half} días`,  total: sum(secondHalf,'total'), blocked: sum(secondHalf,'blocked'), threats: sum(secondHalf,'threats') },
  }

  const trend = (p1: number, p2: number) => p1 === 0 ? 0 : Math.round(((p2 - p1) / p1) * 100)

  return NextResponse.json({
    series,
    days,
    comparison,
    trends: {
      total:   trend(comparison.period1.total,   comparison.period2.total),
      blocked: trend(comparison.period1.blocked,  comparison.period2.blocked),
      threats: trend(comparison.period1.threats,  comparison.period2.threats),
    },
    totals: {
      total:   sum(series,'total'),
      blocked: sum(series,'blocked'),
      threats: sum(series,'threats'),
      bytes:   sum(series,'bytes'),
    },
  })
}
