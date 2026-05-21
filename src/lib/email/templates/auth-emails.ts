const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bcvision.bc-security.com'
const BRAND    = 'BCVision · BC Security'
const PRIMARY  = '#3b82f6'

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#060a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060a12;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f1e36 0%,#0d1a2e 100%);border:1px solid #1e3a5f;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,${PRIMARY},#8b5cf6);display:inline-flex;align-items:center;justify-content:center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${BRAND}</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0d1a2e;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#060a12;border:1px solid #0f2038;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#334155;">© 2025 BC Security · BCVision Platform</p>
          <p style="margin:6px 0 0;font-size:11px;color:#1e3a5f;">Si no solicitaste este correo, ignóralo.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string, color = PRIMARY): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
    <tr><td style="background:${color};border-radius:12px;padding:14px 32px;">
      <a href="${url}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;display:block;">${text}</a>
    </td></tr>
  </table>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">${text}</h1>`
}

function p(text: string, muted = false): string {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${muted ? '#475569' : '#94a3b8'};">${text}</p>`
}

/* ─── Bienvenida / confirmación de cuenta ──────────────────────────────── */
export function welcomeEmailHtml(opts: { name: string; email: string; confirmUrl: string }): string {
  return base(`
    ${h1('¡Bienvenido a BCVision!')}
    ${p(`Hola <strong style="color:#fff;">${opts.name}</strong>, tu cuenta ha sido creada.`)}
    ${p('Confirma tu dirección de email para activar tu cuenta y comenzar a monitorear tu infraestructura.')}
    ${btn('Confirmar mi cuenta', opts.confirmUrl)}
    <p style="margin:20px 0 0;font-size:12px;color:#334155;text-align:center;">
      O copia este enlace: <span style="color:${PRIMARY};">${opts.confirmUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #1e3a5f;margin:24px 0;">
    ${p(`Cuenta: <strong style="color:#fff;">${opts.email}</strong>`, true)}
    ${p('El enlace expira en 24 horas.', true)}
  `)
}

export function welcomeEmailText(opts: { name: string; email: string; confirmUrl: string }): string {
  return `Bienvenido a BCVision, ${opts.name}!\n\nConfirma tu cuenta:\n${opts.confirmUrl}\n\nEl enlace expira en 24 horas.\nBC Security`
}

/* ─── Recuperación de contraseña ───────────────────────────────────────── */
export function resetPasswordEmailHtml(opts: { name?: string; resetUrl: string }): string {
  return base(`
    ${h1('Restablecer contraseña')}
    ${p(opts.name ? `Hola <strong style="color:#fff;">${opts.name}</strong>,` : 'Hola,')}
    ${p('Recibimos una solicitud para restablecer la contraseña de tu cuenta BCVision.')}
    ${btn('Restablecer contraseña', opts.resetUrl, '#ef4444')}
    <p style="margin:20px 0 0;font-size:12px;color:#334155;text-align:center;">
      O copia: <span style="color:#ef4444;">${opts.resetUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #1e3a5f;margin:24px 0;">
    ${p('Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.', true)}
    ${p('El enlace expira en 1 hora.', true)}
  `)
}

export function resetPasswordEmailText(opts: { name?: string; resetUrl: string }): string {
  return `Restablecer contraseña BCVision\n\nEnlace:\n${opts.resetUrl}\n\nExpira en 1 hora.\nBC Security`
}

/* ─── Invitación a una organización ───────────────────────────────────────*/
export function inviteEmailHtml(opts: { orgName: string; inviteUrl: string; invitedBy?: string }): string {
  return base(`
    ${h1(`Invitación a ${opts.orgName}`)}
    ${p(opts.invitedBy
      ? `<strong style="color:#fff;">${opts.invitedBy}</strong> te ha invitado a gestionar la organización en BCVision.`
      : `Has sido invitado a gestionar <strong style="color:#fff;">${opts.orgName}</strong> en BCVision.`
    )}
    ${p('Acepta la invitación para establecer tu contraseña y acceder al panel de seguridad.')}
    ${btn('Aceptar invitación', opts.inviteUrl, '#8b5cf6')}
    <p style="margin:20px 0 0;font-size:12px;color:#334155;text-align:center;">
      O copia: <span style="color:#8b5cf6;">${opts.inviteUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #1e3a5f;margin:24px 0;">
    ${p('BCVision es la plataforma de análisis de firewall de BC Security.', true)}
    ${p('El enlace expira en 24 horas.', true)}
  `)
}

export function inviteEmailText(opts: { orgName: string; inviteUrl: string; invitedBy?: string }): string {
  return `Invitación a ${opts.orgName} — BCVision\n\nAcepta tu invitación:\n${opts.inviteUrl}\n\nExpira en 24 horas.\nBC Security`
}
