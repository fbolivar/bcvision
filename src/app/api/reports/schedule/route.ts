import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  report_type: z.enum(['executive', 'technical', 'compliance', 'custom']),
  frequency:   z.enum(['daily', 'weekly', 'monthly']),
  email:       z.string().email(),
  include_pdf: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile || !['admin', 'analyst'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos para programar reportes' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { report_type, frequency, email, include_pdf } = parsed.data

  const { data, error } = await supabase
    .from('report_schedules')
    .insert({
      org_id:       profile.org_id,
      created_by:   user.id,
      report_type,
      frequency,
      email,
      include_pdf,
      active:       true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, schedule: data })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
