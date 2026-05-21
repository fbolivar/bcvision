import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Vercel Cron: 0 3 * * 0 (domingos 3 AM)
// Elimina eventos más viejos que el retention_days de cada org
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Obtener todas las orgs y sus settings de retención
  const { data: settings } = await admin
    .from('org_settings')
    .select('org_id, retention_days')

  if (!settings?.length) return NextResponse.json({ deleted: 0 })

  let totalDeleted = 0

  for (const s of settings) {
    const retentionDays = s.retention_days ?? 90
    const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString()

    const { count } = await admin
      .from('firewall_events')
      .delete({ count: 'exact' })
      .eq('org_id', s.org_id)
      .lt('event_time', cutoff)

    totalDeleted += count ?? 0
  }

  return NextResponse.json({ deleted: totalDeleted, orgs_processed: settings.length })
}
