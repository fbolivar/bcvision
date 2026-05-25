import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { z } from 'zod'
import { aggregateReportMetrics } from '@/features/reports/services/metrics-aggregator'
import { generateExecutiveReport } from '@/features/reports/services/claude-report.service'

const schema = z.object({
  type:         z.enum(['executive', 'technical', 'compliance', 'vpn_users']),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title:        z.string().min(3).max(120).optional(),
})

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('org_id, role').eq('id', user.id).single()

    if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })
    if (!['admin', 'analyst'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sin permisos para generar reportes' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { type, period_start, period_end, title } = parsed.data
    const TYPE_NAMES: Record<string, string> = { executive: 'Ejecutivo', technical: 'Técnico', compliance: 'de Cumplimiento', vpn_users: 'Usuarios VPN' }
    const reportTitle = title ?? `Reporte ${TYPE_NAMES[type] ?? type} — ${period_start} al ${period_end}`

    // 1. Crear registro del reporte en estado "generating"
    const admin = adminClient()
    const { data: reportRecord, error: insertError } = await admin
      .from('reports')
      .insert({
        org_id:       profile.org_id,
        created_by:   user.id,
        type,
        title:        reportTitle,
        period_start,
        period_end,
        status:       'generating',
      })
      .select('id')
      .single()

    if (insertError || !reportRecord) {
      return NextResponse.json({ error: 'Error creando reporte' }, { status: 500 })
    }

    const reportId = reportRecord.id

    // 2. Agregar métricas del período
    let metrics
    try {
      metrics = await aggregateReportMetrics(profile.org_id, period_start, period_end)
    } catch (err) {
      await admin.from('reports').update({ status: 'failed' }).eq('id', reportId)
      return NextResponse.json({ error: 'Error agregando métricas' }, { status: 500 })
    }

    // 3. Generar narrativa con Claude (si hay API key configurada)
    let aiContent = null
    const AI_TYPES = ['executive', 'technical', 'compliance'] as const
    if (process.env.ANTHROPIC_API_KEY && (AI_TYPES as readonly string[]).includes(type)) {
      try {
        aiContent = await generateExecutiveReport(metrics, type as typeof AI_TYPES[number])
      } catch (err) {
        console.error('[Reports] Error Claude API:', err)
      }
    }

    // 4. Guardar contenido del reporte
    const contentJson = {
      metrics,
      ai_narrative: aiContent,
      generated_at: new Date().toISOString(),
    }

    await admin
      .from('reports')
      .update({ status: 'ready', content_json: contentJson, generated_at: new Date().toISOString() })
      .eq('id', reportId)

    return NextResponse.json({
      success: true,
      report_id: reportId,
      has_ai_narrative: !!aiContent,
      metrics_summary: {
        total_events:  metrics.summary.total_events,
        threats:       metrics.summary.threat_events,
        blocked:       metrics.summary.blocked_events,
        period_days:   metrics.period.days,
      },
    })
  } catch (err) {
    console.error('[Reports] Error inesperado:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
