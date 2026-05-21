import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  brand_name:               z.string().max(80).optional(),
  brand_color:              z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logo_url:                 z.string().url().optional().nullable(),
  retention_days:           z.number().int().min(7).max(3650).optional(),
  alert_email_enabled:      z.boolean().optional(),
  alert_email_recipients:   z.array(z.string().email()).max(10).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data } = await supabase.from('org_settings').select('*').eq('org_id', profile.org_id).single()
  return NextResponse.json(data ?? {})
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['admin', 'super_admin'].includes(profile.role)) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { data: existing } = await admin.from('org_settings').select('id').eq('org_id', profile.org_id).single()

  let result
  if (existing) {
    result = await admin.from('org_settings')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('org_id', profile.org_id)
      .select().single()
  } else {
    result = await admin.from('org_settings')
      .insert({ org_id: profile.org_id, ...parsed.data })
      .select().single()
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json({ ok: true, settings: result.data })
}
