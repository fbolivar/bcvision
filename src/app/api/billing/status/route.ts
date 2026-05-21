import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('org_id, role').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })

    const admin = createAdminClient()

    const [orgRes, subRes, invoicesRes] = await Promise.all([
      admin.from('organizations')
        .select('id, name, plan, monthly_price')
        .eq('id', profile.org_id).single(),
      admin.from('subscriptions')
        .select('*').eq('org_id', profile.org_id).single(),
      admin.from('invoices')
        .select('*').eq('org_id', profile.org_id)
        .order('created_at', { ascending: false }).limit(12),
    ])

    return NextResponse.json({
      org:          orgRes.data,
      subscription: subRes.data ?? null,
      invoices:     invoicesRes.data ?? [],
    })
  } catch (err) {
    console.error('[billing/status]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
