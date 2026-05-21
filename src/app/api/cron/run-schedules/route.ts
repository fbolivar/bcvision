import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { aggregateReportMetrics } from '@/features/reports/services/metrics-aggregator'
import { sendMail } from '@/lib/email/mailer'
import { reportEmailHtml, reportEmailText } from '@/lib/email/templates/report-email'

export const dynamic = 'force-dynamic'

// Vercel Cron: 0 7 * * * (cada día 7 AM)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SMTP_PASS) return NextResponse.json({ skipped: 'no smtp config' })

  const admin = createAdminClient()
  const now   = new Date()

  const { data: schedules } = await admin
    .from('report_schedules')
    .select('*, organizations(name)')
    .eq('active', true)
    .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`)

  if (!schedules?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const sched of schedules) {
    try {
      const org = (sched.organizations as { name: string } | null)
      const orgName = org?.name ?? 'Tu organización'

      // Calcular período según frecuencia
      const periodEnd   = now.toISOString().slice(0, 10)
      const days        = sched.frequency === 'daily' ? 1 : sched.frequency === 'weekly' ? 7 : 30
      const periodStart = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

      const metrics = await aggregateReportMetrics(sched.org_id, periodStart, periodEnd)

      const threats     = metrics.summary.threat_events
      const blocked     = metrics.summary.blocked_events
      const total       = metrics.summary.total_events
      const riskRatio   = total > 0 ? threats / total : 0
      const riskLevel   = riskRatio > 0.1 ? 'Alto' : riskRatio > 0.03 ? 'Medio' : 'Bajo'

      const typeLabel   = sched.report_type === 'executive' ? 'Ejecutivo'
                        : sched.report_type === 'technical'  ? 'Técnico'
                        : 'Cumplimiento'
      const title       = `Reporte ${typeLabel} — ${periodStart} al ${periodEnd}`

      // Guardar reporte en DB
      const { data: reportRecord } = await admin.from('reports').insert({
        org_id:       sched.org_id,
        type:         sched.report_type,
        title,
        period_start: periodStart,
        period_end:   periodEnd,
        status:       'ready',
        content_json: { metrics, generated_at: now.toISOString() },
        generated_at: now.toISOString(),
        sent_to:      [sched.email],
      }).select('id').single()

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bcvision.app'

      await sendMail({
        to:      sched.email,
        subject: `Reporte ${typeLabel} — ${orgName} · ${periodStart} al ${periodEnd}`,
        html:    reportEmailHtml({
          orgName, reportTitle: title, reportType: sched.report_type,
          periodStart, periodEnd,
          summary: { totalEvents: total, threats, blocked, riskLevel: riskLevel as 'Alto' | 'Medio' | 'Bajo' },
          dashboardUrl: siteUrl, hasPdf: false,
        }),
        text: reportEmailText({
          orgName, reportTitle: title, reportType: sched.report_type,
          periodStart, periodEnd,
          summary: { totalEvents: total, threats, blocked, riskLevel: riskLevel as 'Alto' | 'Medio' | 'Bajo' },
          dashboardUrl: siteUrl, hasPdf: false,
        }),
      })

      // Calcular próxima ejecución
      const nextRun = new Date(now)
      if (sched.frequency === 'daily')        nextRun.setDate(nextRun.getDate() + 1)
      else if (sched.frequency === 'weekly')  nextRun.setDate(nextRun.getDate() + 7)
      else                                    nextRun.setMonth(nextRun.getMonth() + 1)

      await admin.from('report_schedules').update({
        last_sent_at: now.toISOString(),
        next_run_at:  nextRun.toISOString(),
      }).eq('id', sched.id)

      processed++
    } catch (err) {
      console.error('[Cron schedules] Error procesando schedule:', sched.id, err)
    }
  }

  return NextResponse.json({ processed })
}
