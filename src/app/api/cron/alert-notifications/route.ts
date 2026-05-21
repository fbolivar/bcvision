import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendAlertEmail } from '@/app/api/alerts/route'

export const dynamic = 'force-dynamic'

// Vercel Cron: */15 * * * * (cada 15 min)
// Envía emails para alertas críticas/altas creadas en los últimos 20 minutos sin notificar
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin   = createAdminClient()
  const since   = new Date(Date.now() - 20 * 60 * 1000).toISOString()

  const { data: alerts } = await admin
    .from('alerts')
    .select('id, org_id, title, severity, description, created_at')
    .in('severity', ['critical', 'high'])
    .eq('status', 'open')
    .gte('created_at', since)
    .is('notes', null) // usamos notes=null como proxy de "no notificado"

  if (!alerts?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const alert of alerts) {
    await sendAlertEmail(admin, alert.org_id, alert)
    // Marcar como notificado en notes
    await admin.from('alerts').update({ notes: '__email_sent__' }).eq('id', alert.id)
    sent++
  }

  return NextResponse.json({ sent })
}
