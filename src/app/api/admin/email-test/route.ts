import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyConnection, sendMail, FROM } from '@/lib/email/mailer'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { to } = await request.json()
  const dest = to || user.email

  // Verificar conexión SMTP primero
  const check = await verifyConnection()
  if (!check.ok) return NextResponse.json({ error: `Error de conexión SMTP: ${check.error}` }, { status: 500 })

  // Enviar correo de prueba
  try {
    await sendMail({
      to:      dest,
      subject: 'Prueba de correo — BCVision',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#3b82f6;margin-bottom:8px;">BCVision · BC Security</h2>
          <p style="color:#374151;">El servidor de correo está correctamente configurado.</p>
          <p style="color:#6b7280;font-size:14px;">Este es un mensaje de prueba enviado desde el Panel MSSP.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="color:#9ca3af;font-size:12px;">Remitente: ${FROM}</p>
        </div>
      `,
      text: 'BCVision — El servidor de correo está correctamente configurado.',
    })
    return NextResponse.json({ ok: true, to: dest })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error enviando correo' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  void request
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const check = await verifyConnection()
  return NextResponse.json({
    ok:   check.ok,
    from: process.env.SMTP_USER ?? '—',
    host: process.env.SMTP_HOST ?? '—',
    port: process.env.SMTP_PORT ?? '—',
    error: check.error,
  })
}
