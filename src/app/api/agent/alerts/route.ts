import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const AlertSchema = z.object({
  queue_id:    z.number(),
  event_time:  z.string(),
  source_ip:   z.string(),
  brand:       z.string(),
  event_type:  z.string(),
  severity:    z.enum(['critical', 'high']),
  src_ip:      z.string().nullable().optional(),
  dst_ip:      z.string().nullable().optional(),
  threat_name: z.string().nullable().optional(),
  threat_cat:  z.string().nullable().optional(),
  firewall_rule: z.string().nullable().optional(),
})

const BodySchema = z.object({
  alerts:     z.array(AlertSchema),
  agent_name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: keyRecord } = await supabase
    .from('agent_api_keys')
    .select('id, org_id, device_id')
    .eq('api_key', apiKey)
    .eq('active', true)
    .single()

  if (!keyRecord) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 422 })

  const { alerts } = parsed.data

  if (alerts.length > 0) {
    const rows = alerts.map(a => ({
      org_id:       keyRecord.org_id,
      device_id:    keyRecord.device_id,
      event_time:   a.event_time,
      event_type:   a.event_type,
      severity:     a.severity,
      src_ip:       a.src_ip ?? null,
      dst_ip:       a.dst_ip ?? null,
      threat_name:  a.threat_name ?? null,
      threat_category: a.threat_cat ?? null,
      firewall_rule: a.firewall_rule ?? null,
      source_ip:    a.source_ip,
      action:       'deny',
      protocol:     null,
      src_port:     null,
      dst_port:     null,
      src_country:  null,
      dst_country:  null,
      bytes_sent:   0,
      bytes_received: 0,
      duration_ms:  null,
      user_name:    null,
      url:          null,
      application:  null,
      parsed_data:  {},
    }))

    const { error } = await supabase.from('firewall_events').insert(rows)
    if (error) console.error('[agent/alerts] insert error:', error.message)
  }

  await supabase
    .from('agent_api_keys')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', keyRecord.id)

  return NextResponse.json({ ok: true, received: alerts.length })
}
