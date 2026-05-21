import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/email/mailer'
import { alertEmailHtml, alertEmailText } from '@/lib/email/templates/alert-email'
import { z } from 'zod'

const schema = z.object({
  event_id:    z.number().optional(),
  device_id:   z.string().uuid().optional(),
  type:        z.string().min(1),
  title:       z.string().min(1),
  description: z.string().optional(),
  severity:    z.enum(['critical','high','medium','low','info']),
})

// POST /api/alerts — crear alerta y enviar email si está habilitado
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })
  if (!['admin', 'analyst'].includes(profile.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const admin = createAdminClient()

  const { data: alert, error } = await admin
    .from('alerts')
    .insert({ org_id: profile.org_id, created_by: user.id, status: 'open', ...parsed.data })
    .select('*')
    .single()

  if (error || !alert) return NextResponse.json({ error: error?.message ?? 'Error creando alerta' }, { status: 500 })

  // Enviar email si está habilitado y severidad es crítica o alta
  if (['critical', 'high'].includes(alert.severity)) {
    await sendAlertEmail(admin, profile.org_id, alert)
  }

  return NextResponse.json({ ok: true, alert })
}

// GET /api/alerts — listar alertas de la org
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sp    = req.nextUrl.searchParams
  const status = sp.get('status')
  const limit  = parseInt(sp.get('limit') ?? '50', 10)

  let query = supabase
    .from('alerts')
    .select('*, firewall_event:firewall_events(src_ip,dst_ip,severity), device:devices(name,brand)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function sendAlertEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  orgId: string,
  alert: { title: string; severity: string; description: string | null; created_at: string }
) {
  const { data: settings } = await admin
    .from('org_settings')
    .select('alert_email_enabled, alert_email_recipients, brand_name, logo_url, brand_color')
    .eq('org_id', orgId)
    .single()

  if (!settings?.alert_email_enabled || !settings.alert_email_recipients?.length) return

  const { data: org } = await admin.from('organizations').select('name').eq('id', orgId).single()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bcvision.bc-security.com'
  const orgName = settings.brand_name ?? org?.name ?? 'Tu organización'

  try {
    await sendMail({
      to:      settings.alert_email_recipients,
      subject: `[${alert.severity.toUpperCase()}] Alerta: ${alert.title}`,
      html:    alertEmailHtml({ orgName, alertTitle: alert.title, severity: alert.severity, description: alert.description, deviceName: null, srcIp: null, dstIp: null, detectedAt: alert.created_at, dashboardUrl: siteUrl, logoUrl: settings.logo_url, brandColor: settings.brand_color }),
      text:    alertEmailText({ orgName, alertTitle: alert.title, severity: alert.severity, description: alert.description, deviceName: null, srcIp: null, dstIp: null, detectedAt: alert.created_at, dashboardUrl: siteUrl }),
    })
  } catch (err) {
    console.error('[Alert Email] Error:', err)
  }
}
