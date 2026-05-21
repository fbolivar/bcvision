import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (!['admin', 'analyst'].includes(profile.role)) return NextResponse.json({ error: 'Sin permisos para exportar' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const format   = sp.get('format') === 'json' ? 'json' : 'csv'
  const protocol = sp.get('protocol')
  const action   = sp.get('action')
  const severity = sp.get('severity')
  const srcIp    = sp.get('src_ip')
  const dstIp    = sp.get('dst_ip')
  const search   = sp.get('search')

  let query = supabase
    .from('firewall_events')
    .select('event_time, event_type, action, severity, protocol, src_ip, src_port, dst_ip, dst_port, bytes_sent, bytes_received, country_src, country_dst, raw_message')
    .eq('org_id', profile.org_id)
    .order('event_time', { ascending: false })
    .limit(10000)

  if (protocol) query = query.ilike('protocol', `%${protocol}%`)
  if (action)   query = query.eq('action', action)
  if (severity) query = query.eq('severity', severity)
  if (srcIp)    query = query.ilike('src_ip_text', `%${srcIp}%`)
  if (dstIp)    query = query.ilike('dst_ip_text', `%${dstIp}%`)
  if (search)   query = query.or(`src_ip_text.ilike.%${search}%,dst_ip_text.ilike.%${search}%,protocol.ilike.%${search}%,user_name.ilike.%${search}%,application.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const events = data ?? []
  const filename = `eventos_${new Date().toISOString().slice(0, 10)}.${format}`

  if (format === 'json') {
    return new NextResponse(JSON.stringify(events, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // CSV
  const COLS = ['event_time', 'event_type', 'action', 'severity', 'protocol', 'src_ip', 'src_port', 'dst_ip', 'dst_port', 'bytes_sent', 'bytes_received', 'country_src', 'country_dst']
  const header = COLS.join(',')
  const rows = events.map(e =>
    COLS.map(col => {
      const val = (e as Record<string, unknown>)[col]
      if (val === null || val === undefined) return ''
      const s = String(val)
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
