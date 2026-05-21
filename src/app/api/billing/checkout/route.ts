import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { buildCheckoutParams } from '@/lib/wompi/wompi.service'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('org_id, role').eq('id', user.id).single()

    if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })
    if (!['admin'].includes(profile.role)) return NextResponse.json({ error: 'Solo el administrador puede iniciar el pago' }, { status: 403 })

    // adminClient para bypasar RLS en operaciones de facturación
    const admin = createAdminClient()

    const { data: org } = await admin
      .from('organizations')
      .select('id, slug, name, plan, monthly_price')
      .eq('id', profile.org_id).single()

    if (!org) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    if (!org.monthly_price || org.monthly_price <= 0) return NextResponse.json({ error: 'Esta organización no tiene precio configurado. Contacta a tu proveedor.' }, { status: 400 })

    const periodStart = new Date()
    const periodEnd   = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const { data: invoice, error: invErr } = await admin
      .from('invoices')
      .insert({
        org_id:          org.id,
        amount_in_cents: org.monthly_price * 100,
        currency:        'COP',
        status:          'pending',
        period_start:    periodStart.toISOString(),
        period_end:      periodEnd.toISOString(),
      })
      .select().single()

    if (invErr || !invoice) {
      console.error('[billing/checkout] invoice error:', invErr)
      return NextResponse.json({ error: 'Error creando factura' }, { status: 500 })
    }

    const checkout = buildCheckoutParams({
      orgSlug:       org.slug,
      invoiceId:     invoice.id,
      amountInCents: invoice.amount_in_cents,
      customerEmail: user.email,
    })

    await admin.from('invoices')
      .update({ wompi_reference: checkout.reference })
      .eq('id', invoice.id)

    return NextResponse.json({ checkout, invoice_id: invoice.id })
  } catch (err) {
    console.error('[billing/checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
