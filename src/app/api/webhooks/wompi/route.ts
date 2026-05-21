import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/wompi/wompi.service'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Verificar firma
    const checksum = body?.signature?.checksum as string | undefined
    if (!checksum || !verifyWebhookSignature(body, checksum)) {
      console.warn('[webhooks/wompi] Firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const event       = body.event as string
    const transaction = body.data?.transaction as Record<string, unknown> | undefined

    if (!transaction) return NextResponse.json({ ok: true })

    const wompiTxId  = String(transaction.id ?? '')
    const reference  = String(transaction.reference ?? '')
    const status     = String(transaction.status ?? '')

    if (event !== 'transaction.updated') return NextResponse.json({ ok: true })

    const supabase = await createClient()

    // Buscar la factura por referencia
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, org_id, period_start, period_end, amount_in_cents')
      .eq('wompi_reference', reference)
      .single()

    if (!invoice) {
      console.warn('[webhooks/wompi] Factura no encontrada para referencia:', reference)
      return NextResponse.json({ ok: true })
    }

    if (status === 'APPROVED') {
      // Marcar factura como pagada
      await supabase.from('invoices').update({
        status:               'paid',
        wompi_transaction_id: wompiTxId,
        paid_at:              new Date().toISOString(),
      }).eq('id', invoice.id)

      // Activar o renovar suscripción
      await supabase.from('subscriptions').upsert({
        org_id:               invoice.org_id,
        status:               'active',
        current_period_start: invoice.period_start,
        current_period_end:   invoice.period_end,
        updated_at:           new Date().toISOString(),
      }, { onConflict: 'org_id' })

      console.log('[webhooks/wompi] Pago aprobado — org:', invoice.org_id)

    } else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') {
      await supabase.from('invoices').update({
        status:               'failed',
        wompi_transaction_id: wompiTxId,
      }).eq('id', invoice.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhooks/wompi] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
