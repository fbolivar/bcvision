import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReportPDF } from '@/features/reports/pdf/report-template'
import { VpnReportPDF } from '@/features/reports/pdf/vpn-report'
import type { ReportMetrics } from '@/features/reports/services/metrics-aggregator'
import type { GeneratedReport } from '@/features/reports/services/claude-report.service'
import React from 'react'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('org_id').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })

    // Cargar branding de la org
    const { data: orgSettings } = await supabase
      .from('org_settings')
      .select('brand_name, brand_color, logo_url')
      .eq('org_id', profile.org_id)
      .single()

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single()

    if (error || !report) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    if (report.status !== 'ready') return NextResponse.json({ error: 'Reporte no está listo' }, { status: 400 })

    const content = report.content_json as {
      metrics: ReportMetrics
      ai_narrative: GeneratedReport | null
    }

    const element = report.type === 'vpn_users'
      ? React.createElement(VpnReportPDF, {
          metrics:    content.metrics,
          brandName:  orgSettings?.brand_name,
          brandColor: orgSettings?.brand_color,
        })
      : React.createElement(ReportPDF, {
          metrics:    content.metrics,
          narrative:  content.ai_narrative,
          reportType: report.type as string,
          brandName:  orgSettings?.brand_name,
          brandColor: orgSettings?.brand_color,
          logoUrl:    orgSettings?.logo_url,
        })

    const buffer = await renderToBuffer(element as React.ReactElement<{ title?: string }>)
    const filename = `reporte-${report.type}-${report.period_start}-${report.period_end}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (err) {
    console.error('[Reports/PDF] Error:', err)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
