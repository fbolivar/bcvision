import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('org_id, role').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })
    if (!['admin', 'analyst'].includes(profile.role))
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { error } = await adminClient()
      .from('reports')
      .delete()
      .eq('id', id)
      .eq('org_id', profile.org_id)

    if (error) return NextResponse.json({ error: 'Error eliminando reporte' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('org_id').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })

    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, title, type, status, period_start, period_end, created_at, generated_at, content_json')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: 'Error obteniendo reportes' }, { status: 500 })

    return NextResponse.json({ reports: reports ?? [] })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
