import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/members/[id] — actualizar rol y/o nombre
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verificar que quien hace la acción es admin de la misma org
  const { data: me } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Solo los administradores pueden editar miembros' }, { status: 403 })

  // Verificar que el target pertenece a la misma org
  const { data: target } = await supabase.from('users').select('org_id, role').eq('id', id).single()
  if (!target || target.org_id !== me.org_id) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  const body = await req.json() as { role?: string; full_name?: string; password?: string }
  const updates: Record<string, string> = {}
  if (body.role      && ['admin','analyst','viewer'].includes(body.role)) updates.role = body.role
  if (body.full_name !== undefined) updates.full_name = body.full_name

  // Password change via admin API (bypasses email confirmation)
  if (body.password) {
    if (body.password.length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    const admin = createAdminClient()
    const { error: pwErr } = await admin.auth.admin.updateUserById(id, { password: body.password })
    if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 500 })
    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })

  const { error } = await supabase.from('users').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/members/[id] — eliminar miembro de la org (no borra el auth user)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (user.id === id) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })

  const { data: me } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Solo los administradores pueden eliminar miembros' }, { status: 403 })

  const { data: target } = await supabase.from('users').select('org_id').eq('id', id).single()
  if (!target || target.org_id !== me.org_id) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  // Desasociar de la org en vez de borrar el registro de auth
  const { error } = await supabase.from('users').update({ org_id: null }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
