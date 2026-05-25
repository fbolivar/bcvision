import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const EventSchema = z.object({
  event_type:       z.enum(['traffic','block','auth','threat','system','vpn','nat']),
  action:           z.enum(['allow','deny','drop','reset','monitor','redirect']).nullable(),
  protocol:         z.string().nullable(),
  src_ip:           z.string().nullable(),
  dst_ip:           z.string().nullable(),
  src_port:         z.number().int().nullable(),
  dst_port:         z.number().int().nullable(),
  src_country:      z.string().nullable(),
  dst_country:      z.string().nullable(),
  bytes_sent:       z.number().default(0),
  bytes_received:   z.number().default(0),
  duration_ms:      z.number().nullable(),
  user_name:        z.string().nullable(),
  url:              z.string().nullable(),
  application:      z.string().nullable(),
  threat_name:      z.string().nullable(),
  threat_category:  z.string().nullable(),
  severity:         z.enum(['critical','high','medium','low','info']),
  parsed_data:      z.record(z.string(), z.unknown()).default({}),
  firewall_rule:    z.string().nullable().optional(),
})

const IngestSchema = z.object({
  source_ip:    z.string().min(7).max(45),
  raw_message:  z.string().max(8192),
  facility:     z.number().int().min(0).max(23),
  severity:     z.number().int().min(0).max(7),
  received_at:  z.string().datetime(),
  event:        EventSchema,
  agent_name:   z.string().max(100).optional(),
})

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────
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

  // ── Parse body ──────────────────────────────────────────────────
  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = IngestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.issues }, { status: 422 })
  }

  const d = parsed.data
  const orgId    = keyRecord.org_id
  const deviceId = keyRecord.device_id

  // ── Save raw syslog ─────────────────────────────────────────────
  const { data: rawRecord, error: rawError } = await supabase
    .from('syslog_raw')
    .insert({
      org_id:      orgId,
      device_id:   deviceId,
      raw_message: d.raw_message,
      source_ip:   d.source_ip,
      facility:    d.facility,
      severity:    d.severity,
      received_at: d.received_at,
    })
    .select('id')
    .single()

  if (rawError) {
    console.error('[agent/ingest] syslog_raw error:', rawError.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // ── Save parsed event ───────────────────────────────────────────
  const { error: evtError } = await supabase
    .from('firewall_events')
    .insert({
      org_id:    orgId,
      device_id: deviceId,
      raw_id:    rawRecord?.id ?? null,
      event_time: d.received_at,
      firewall_rule: d.event.firewall_rule ?? null,
      ...d.event,
    })

  if (evtError) {
    console.error('[agent/ingest] firewall_events error:', evtError.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // ── Update device last_seen ─────────────────────────────────────
  if (deviceId) {
    await supabase
      .from('devices')
      .update({
        last_seen:  new Date().toISOString(),
        ip_address: d.source_ip,
      })
      .eq('id', deviceId)
  }

  // ── Update agent last_seen ──────────────────────────────────────
  await supabase
    .from('agent_api_keys')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', keyRecord.id)

  // ── Auto-create alert (solo amenazas accionables) ───────────────
  const ev = d.event
  const isNamedThreat   = ev.event_type === 'threat' && !!ev.threat_name
  const isMalwareBotnet = ['malware', 'botnet', 'virus'].includes(ev.threat_category ?? '')
  const isAuthFail      = ev.event_type === 'auth' && ev.action === 'deny'
  const isVpnFail       = ev.event_type === 'vpn'  && ev.action === 'deny'

  const shouldAlert = isNamedThreat || isMalwareBotnet || isAuthFail || isVpnFail

  if (shouldAlert) {
    // Deduplicar: si ya existe alerta abierta del mismo threat + IP en la última hora, no crear otra
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count } = await supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'open')
      .gte('created_at', oneHourAgo)
      .eq('title',
        ev.threat_name
          ? `${ev.threat_name}${ev.src_ip ? ` desde ${ev.src_ip}` : ''}`
          : ev.event_type === 'vpn'
          ? `Fallo VPN desde ${ev.src_ip ?? ''}`
          : `Fallo de autenticacion desde ${ev.src_ip ?? ''}`
      )

    if ((count ?? 0) === 0) {
      const { data: savedEvent } = await supabase
        .from('firewall_events')
        .select('id')
        .eq('org_id', orgId)
        .eq('event_time', d.received_at)
        .order('id', { ascending: false })
        .limit(1)
        .single()

      const title = ev.threat_name
        ? `${ev.threat_name}${ev.src_ip ? ` desde ${ev.src_ip}` : ''}`
        : ev.event_type === 'vpn'
        ? `Fallo VPN desde ${ev.src_ip ?? 'desconocido'}`
        : `Fallo de autenticacion desde ${ev.src_ip ?? 'desconocido'}`

      const description = [
        ev.threat_category ? `Categoria: ${ev.threat_category}` : null,
        ev.src_ip && ev.dst_ip ? `${ev.src_ip} → ${ev.dst_ip}` : null,
        ev.src_country ? `Pais origen: ${ev.src_country}` : null,
        ev.firewall_rule ? `Regla: ${ev.firewall_rule}` : null,
      ].filter(Boolean).join(' | ')

      await supabase.from('alerts').insert({
        org_id:      orgId,
        device_id:   deviceId ?? null,
        event_id:    savedEvent?.id ?? null,
        type:        ev.threat_category ?? ev.event_type,
        title,
        description: description || null,
        severity:    ev.severity,
        status:      'open',
      })
    }
  }

  return NextResponse.json({ ok: true })
}
