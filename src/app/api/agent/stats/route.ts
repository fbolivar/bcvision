import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const StatBucketSchema = z.object({
  id:          z.number(),
  hour_bucket: z.string(),
  brand:       z.string().optional(),
  total:       z.number(),
  allowed:     z.number(),
  blocked:     z.number(),
  threats:     z.number(),
  bytes_in:    z.number(),
  bytes_out:   z.number(),
})

const BodySchema = z.object({
  stats:      z.array(StatBucketSchema),
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

  const { stats } = parsed.data

  if (stats.length > 0) {
    const rows = stats.map(s => ({
      org_id:      keyRecord.org_id,
      device_id:   keyRecord.device_id,
      hour_bucket: s.hour_bucket,
      brand:       s.brand ?? 'generic',
      total:       s.total,
      allowed:     s.allowed,
      blocked:     s.blocked,
      threats:     s.threats,
      bytes_in:    s.bytes_in,
      bytes_out:   s.bytes_out,
    }))

    const { error } = await supabase
      .from('agent_hourly_stats')
      .upsert(rows, { onConflict: 'org_id,device_id,hour_bucket,brand' })

    if (error) console.error('[agent/stats] upsert error:', error.message)
  }

  await supabase
    .from('agent_api_keys')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', keyRecord.id)

  return NextResponse.json({ ok: true, received: stats.length })
}
