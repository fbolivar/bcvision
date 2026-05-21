import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/email/mailer'
import { resetPasswordEmailHtml, resetPasswordEmailText } from '@/lib/email/templates/auth-emails'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  try {
    const body   = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })

    const { email } = parsed.data
    const admin = createAdminClient()

    // Verificar que el usuario existe
    const { data: users } = await admin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)

    // Siempre responder OK para no revelar si el email existe
    if (!user) return NextResponse.json({ ok: true })

    // Generar enlace de recuperación
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type:  'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    })

    if (linkErr || !linkData?.properties?.action_link) {
      console.error('[forgot-password] Error generando link:', linkErr)
      return NextResponse.json({ ok: true }) // No revelar el error al cliente
    }

    const resetUrl = linkData.properties.action_link
    const name     = user.user_metadata?.full_name as string | undefined

    await sendMail({
      to:      email,
      subject: 'Restablecer contraseña — BCVision',
      html:    resetPasswordEmailHtml({ name, resetUrl }),
      text:    resetPasswordEmailText({ name, resetUrl }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ ok: true }) // No revelar errores internos
  }
}
