import { NextResponse }    from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z }                 from 'zod'

const schema = z.object({
  name:    z.string().min(2).max(120),
  email:   z.string().email(),
  company: z.string().min(2).max(120),
  devices: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body   = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('leads').insert({
      name:    parsed.data.name,
      email:   parsed.data.email,
      company: parsed.data.company,
      devices: parsed.data.devices ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/leads]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
