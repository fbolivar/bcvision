interface AlertEmailData {
  orgName:      string
  alertTitle:   string
  severity:     string
  description:  string | null
  deviceName:   string | null
  srcIp:        string | null
  dstIp:        string | null
  detectedAt:   string
  dashboardUrl: string
}

const SEV_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#3b82f6',
}

export function alertEmailHtml(d: AlertEmailData): string {
  const color = SEV_COLOR[d.severity] ?? '#64748b'
  const label = d.severity.toUpperCase()
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Alerta de Seguridad — ${d.orgName}</title></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0d1520;border-radius:16px;border:1px solid #1e3a5f;overflow:hidden;max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0f2038,#1a1d3a);padding:28px 32px;border-bottom:1px solid #1e3a5f;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><span style="font-size:20px;font-weight:700;color:#ffffff;">🛡️ BCVision</span><br>
      <span style="font-size:12px;color:#475569;">Sistema de Seguridad — ${d.orgName}</span></td>
      <td align="right"><span style="background:${color}22;border:1px solid ${color}55;color:${color};padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;">${label}</span></td>
    </tr></table>
  </td></tr>

  <!-- Alert body -->
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 6px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;">⚠️ ALERTA DE SEGURIDAD</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff;line-height:1.3;">${d.alertTitle}</h1>
    ${d.description ? `<p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">${d.description}</p>` : ''}

    <!-- Details grid -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1225;border-radius:12px;border:1px solid #1e3a5f;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #0f2038;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;width:120px;">Detectado</td>
          <td style="font-size:13px;color:#e2e8f0;font-family:monospace;">${new Date(d.detectedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
        </tr></table>
      </td></tr>
      ${d.deviceName ? `<tr><td style="padding:16px 20px;border-bottom:1px solid #0f2038;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;width:120px;">Dispositivo</td>
          <td style="font-size:13px;color:#e2e8f0;">${d.deviceName}</td>
        </tr></table>
      </td></tr>` : ''}
      ${d.srcIp ? `<tr><td style="padding:16px 20px;border-bottom:1px solid #0f2038;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;width:120px;">IP Origen</td>
          <td style="font-size:13px;color:#60a5fa;font-family:monospace;">${d.srcIp}</td>
        </tr></table>
      </td></tr>` : ''}
      ${d.dstIp ? `<tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;width:120px;">IP Destino</td>
          <td style="font-size:13px;color:#60a5fa;font-family:monospace;">${d.dstIp}</td>
        </tr></table>
      </td></tr>` : ''}
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${d.dashboardUrl}/alerts" style="display:inline-block;background:${color};color:#ffffff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
        Ver alerta en BCVision →
      </a>
    </td></tr></table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 32px;border-top:1px solid #0f2038;text-align:center;">
    <p style="margin:0;font-size:11px;color:#334155;">Este mensaje fue enviado por BCVision · ${d.orgName}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#1e3a5f;">Para desactivar notificaciones ve a Ajustes → Organización</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`
}

export function alertEmailText(d: AlertEmailData): string {
  return `[${d.severity.toUpperCase()}] ALERTA: ${d.alertTitle}

Organización: ${d.orgName}
Detectado: ${new Date(d.detectedAt).toLocaleString('es-CO')}
${d.deviceName ? `Dispositivo: ${d.deviceName}\n` : ''}${d.srcIp ? `IP Origen: ${d.srcIp}\n` : ''}${d.dstIp ? `IP Destino: ${d.dstIp}\n` : ''}
${d.description ?? ''}

Ver en BCVision: ${d.dashboardUrl}/alerts`
}
