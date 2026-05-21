import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/email/mailer'
import { welcomeEmailHtml, welcomeEmailText } from '@/lib/email/templates/auth-emails'
import { z } from 'zod'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  orgName:  z.string().min(2).max(100),
})

export async function POST(request: Request) {
  try {
    const body   = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { email, password, fullName, orgName } = parsed.data
    const admin = createAdminClient()

    // Crear usuario sin confirmación automática
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // nosotros enviamos el email de confirmación
      user_metadata: { full_name: fullName, org_name: orgName, role: 'admin' },
    })

    if (authErr || !authUser.user) {
      const msg = authErr?.message ?? 'Error creando usuario'
      return NextResponse.json({ error: msg.includes('already registered') ? 'Este email ya está registrado.' : msg }, { status: 400 })
    }

    // Generar enlace de confirmación
    const { data: linkData } = await admin.auth.admin.generateLink({
      type:       'signup',
      email,
      password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    const confirmUrl = linkData?.properties?.action_link ?? `${process.env.NEXT_PUBLIC_APP_URL}/login`

    // Enviar email de bienvenida con nuestro SMTP
    await sendMail({
      to:      email,
      subject: `Confirma tu cuenta — BCVision`,
      html:    welcomeEmailHtml({ name: fullName, email, confirmUrl }),
      text:    welcomeEmailText({ name: fullName, email, confirmUrl }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/signup]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
