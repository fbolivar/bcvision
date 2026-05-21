import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/email/mailer'
import { inviteEmailHtml, inviteEmailText } from '@/lib/email/templates/auth-emails'
import { z } from 'zod'

const schema = z.object({
  name:        z.string().min(2).max(100),
  slug:        z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  plan:          z.enum(['cortesia', 'basico', 'profesional', 'empresarial']),
  max_devices:   z.number().int().min(1).max(10000),
  monthly_price: z.number().int().min(0).optional(),
  admin_email:   z.string().email(),
  tax_id_type:   z.enum(['NIT','CC','CE','RUT','PASAPORTE','OTRO']).optional(),
  tax_id:        z.string().max(30).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { name, slug, plan, max_devices, monthly_price, admin_email, tax_id_type, tax_id } = parsed.data

    // Verificar que el slug no exista
    const { data: existing } = await supabase.from('organizations').select('id').eq('slug', slug).single()
    if (existing) return NextResponse.json({ error: `El slug "${slug}" ya está en uso` }, { status: 409 })

    const adminClient = createAdminClient()

    // Usar adminClient para todas las operaciones de DB (bypasa RLS)
    const { data: org, error: orgErr } = await adminClient
      .from('organizations')
      .insert({ name, slug, plan, max_devices, monthly_price: monthly_price ?? 0, retention_days: 90, tax_id_type: tax_id_type ?? null, tax_id: tax_id ?? null })
      .select()
      .single()

    if (orgErr || !org) return NextResponse.json({ error: orgErr?.message ?? 'Error creando organización' }, { status: 500 })

    // Crear usuario en Supabase Auth sin enviar email (lo enviamos nosotros)
    const { data: newUser, error: userErr } = await adminClient.auth.admin.createUser({
      email:         admin_email,
      email_confirm: false,
      user_metadata: { org_id: org.id, role: 'admin' },
    })

    if (userErr || !newUser.user) {
      await adminClient.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: userErr?.message ?? 'Error creando usuario' }, { status: 500 })
    }

    // Crear registro en public.users
    await adminClient.from('users').upsert({
      id:     newUser.user.id,
      org_id: org.id,
      role:   'admin',
    }, { onConflict: 'id' })

    // Generar enlace de invitación y enviar con nuestro SMTP
    const { data: linkData } = await adminClient.auth.admin.generateLink({
      type:  'invite',
      email: admin_email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })

    const inviteUrl = linkData?.properties?.action_link ?? `${process.env.NEXT_PUBLIC_APP_URL}/login`

    await sendMail({
      to:      admin_email,
      subject: `Invitación a ${org.name} — BCVision`,
      html:    inviteEmailHtml({ orgName: org.name, inviteUrl }),
      text:    inviteEmailText({ orgName: org.name, inviteUrl }),
    })

    return NextResponse.json({ ok: true, org_id: org.id, org_name: org.name })
  } catch (err) {
    console.error('[admin/clients] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
