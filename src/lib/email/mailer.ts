import nodemailer from 'nodemailer'

// Singleton del transporter — se reutiliza en cada invocación serverless
let _transporter: nodemailer.Transporter | null = null

export function getTransporter() {
  if (_transporter) return _transporter
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? 'smtp.hostinger.com',
    port:   Number(process.env.SMTP_PORT ?? 465),
    secure: true, // SSL en puerto 465
    auth: {
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
    },
    tls: { rejectUnauthorized: true },
  })
  return _transporter
}

export const FROM = process.env.SMTP_FROM ?? 'BCVision <operaciones@bc-security.com>'

export async function sendMail(opts: {
  to:      string | string[]
  subject: string
  html:    string
  text?:   string
}) {
  const transporter = getTransporter()
  return transporter.sendMail({
    from:    FROM,
    to:      Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
    subject: opts.subject,
    html:    opts.html,
    text:    opts.text,
  })
}

export async function verifyConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getTransporter().verify()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
