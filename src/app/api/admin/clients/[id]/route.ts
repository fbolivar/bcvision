import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name:          z.string().min(2).max(100).optional(),
  plan:          z.enum(['basico', 'profesional', 'empresarial']).optional(),
  max_devices:   z.number().int().min(1).max(10000).optional(),
  monthly_price: z.number().int().min(0).optional(),
  tax_id_type:   z.enum(['NIT','CC','CE','RUT','PASAPORTE','OTRO']).optional(),
  tax_id:        z.string().max(30).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }

    // Usar admin client para bypassar RLS en organizations
    const adminDb = createAdminClient()
    const { data: org, error } = await adminDb
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !org) return NextResponse.json({ error: error?.message ?? 'Organización no encontrada' }, { status: 404 })

    return NextResponse.json({ ok: true, org })
  } catch (err) {
    console.error('[admin/clients/PATCH] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const adminDb = createAdminClient()
    const { error } = await adminDb.from('organizations').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/clients/DELETE] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
