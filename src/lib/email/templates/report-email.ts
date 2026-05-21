interface ReportEmailData {
  orgName:     string
  reportTitle: string
  reportType:  string
  periodStart: string
  periodEnd:   string
  summary: {
    totalEvents:  number
    threats:      number
    blocked:      number
    riskLevel:    'Alto' | 'Medio' | 'Bajo'
  }
  dashboardUrl: string
  hasPdf:       boolean
}

const RISK_COLOR = { Alto: '#ef4444', Medio: '#f97316', Bajo: '#22c55e' }
const TYPE_LABEL: Record<string, string> = {
  executive:  'Ejecutivo',
  technical:  'Técnico FortiAnalyzer',
  compliance: 'Cumplimiento (PCI DSS / ISO 27001)',
}

export function reportEmailHtml(d: ReportEmailData): string {
  const riskColor = RISK_COLOR[d.summary.riskLevel]
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${d.reportTitle}</title></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0d1520;border-radius:16px;border:1px solid #1e3a5f;overflow:hidden;max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0f2038,#1a1d3a);padding:28px 32px;border-bottom:1px solid #1e3a5f;">
    <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#fff;">🛡️ BCVision — Reporte de Seguridad</p>
    <p style="margin:0;font-size:12px;color:#475569;">${d.orgName} · ${TYPE_LABEL[d.reportType] ?? d.reportType}</p>
  </td></tr>

  <!-- Period -->
  <tr><td style="padding:24px 32px 0;">
    <p style="margin:0 0 4px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Período analizado</p>
    <p style="margin:0;font-size:18px;font-weight:600;color:#fff;">${d.periodStart} → ${d.periodEnd}</p>
  </td></tr>

  <!-- KPI grid -->
  <tr><td style="padding:20px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
      <tr style="background:#0a1225;">
        <td style="padding:16px;text-align:center;border-right:1px solid #0f2038;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#60a5fa;">${d.summary.totalEvents.toLocaleString('es-CO')}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#475569;">Eventos totales</p>
        </td>
        <td style="padding:16px;text-align:center;border-right:1px solid #0f2038;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#f87171;">${d.summary.threats.toLocaleString('es-CO')}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#475569;">Amenazas detectadas</p>
        </td>
        <td style="padding:16px;text-align:center;border-right:1px solid #0f2038;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#4ade80;">${d.summary.blocked.toLocaleString('es-CO')}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#475569;">Eventos bloqueados</p>
        </td>
        <td style="padding:16px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:${riskColor};">● ${d.summary.riskLevel}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#475569;">Nivel de riesgo</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- PDF note -->
  ${d.hasPdf ? `<tr><td style="padding:0 32px 20px;">
    <p style="margin:0;font-size:13px;color:#94a3b8;background:#0a1225;border:1px solid #1e3a5f;border-radius:10px;padding:14px 18px;">
      📎 El reporte PDF completo está adjunto a este correo.
    </p>
  </td></tr>` : ''}

  <!-- CTA -->
  <tr><td style="padding:0 32px 28px;">
    <a href="${d.dashboardUrl}/reports" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
      Ver reporte completo en BCVision →
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 32px;border-top:1px solid #0f2038;text-align:center;">
    <p style="margin:0;font-size:11px;color:#334155;">Reporte generado automáticamente por BCVision · ${d.orgName}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#1e3a5f;">Para modificar la frecuencia ve a Ajustes → Reportes</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`
}

export function reportEmailText(d: ReportEmailData): string {
  return `REPORTE DE SEGURIDAD — ${d.orgName}
${d.reportTitle}
Período: ${d.periodStart} → ${d.periodEnd}

RESUMEN:
- Eventos totales: ${d.summary.totalEvents.toLocaleString('es-CO')}
- Amenazas detectadas: ${d.summary.threats.toLocaleString('es-CO')}
- Eventos bloqueados: ${d.summary.blocked.toLocaleString('es-CO')}
- Nivel de riesgo: ${d.summary.riskLevel}

Ver reporte completo: ${d.dashboardUrl}/reports`
}
