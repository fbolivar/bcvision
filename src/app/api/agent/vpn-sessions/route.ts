import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const SessionSchema = z.object({
  user_name:    z.string().min(1),
  remote_ip:    z.string().default(''),
  tunnel_ip:    z.string().default(''),
  tunnel_name:  z.string().default(''),
  duration_sec: z.number().default(0),
  bytes_tx:     z.number().default(0),
  bytes_rx:     z.number().default(0),
  os_name:      z.string().default(''),
  tunnel_type:  z.string().default('ipsec'),
})

const BodySchema = z.object({
  sessions:   z.array(SessionSchema),
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
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 422 })

  const { sessions } = parsed.data
  const orgId    = keyRecord.org_id
  const deviceId = keyRecord.device_id
  const now      = new Date().toISOString()

  // 1. Upsert current active sessions (estado actual)
  for (const s of sessions) {
    await supabase.from('vpn_active_sessions').upsert({
      org_id:       orgId,
      device_id:    deviceId,
      user_name:    s.user_name,
      remote_ip:    s.remote_ip || null,
      tunnel_ip:    s.tunnel_ip || null,
      duration_sec: s.duration_sec,
      bytes_tx:     s.bytes_tx,
      bytes_rx:     s.bytes_rx,
      os_name:      s.os_name || null,
      tunnel_type:  s.tunnel_type,
      last_seen:    now,
    }, { onConflict: 'org_id,user_name' })
  }

  // 2. Log snapshot histórico (para reportes)
  if (sessions.length > 0) {
    await supabase.from('vpn_session_log').insert(
      sessions.map(s => ({
        org_id:       orgId,
        device_id:    deviceId,
        user_name:    s.user_name,
        remote_ip:    s.remote_ip || null,
        tunnel_ip:    s.tunnel_ip || null,
        tunnel_name:  s.tunnel_name || null,
        duration_sec: s.duration_sec,
        bytes_tx:     s.bytes_tx,
        bytes_rx:     s.bytes_rx,
        tunnel_type:  s.tunnel_type,
        snapshot_at:  now,
      }))
    )
  }

  // 3. Eliminar sesiones que ya no están activas de vpn_active_sessions
  if (sessions.length > 0) {
    const activeUsers = sessions.map(s => s.user_name)
    await supabase
      .from('vpn_active_sessions')
      .delete()
      .eq('org_id', orgId)
      .not('user_name', 'in', `(${activeUsers.map(u => `"${u}"`).join(',')})`)
  } else {
    await supabase.from('vpn_active_sessions').delete().eq('org_id', orgId)
  }

  return NextResponse.json({ ok: true, active: sessions.length })
}
