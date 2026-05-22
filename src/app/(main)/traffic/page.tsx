import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/shared/components/topbar'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { TrafficFilters } from '@/features/traffic/components/traffic-filters'
import { RecentEventsTable } from '@/features/dashboard/components/recent-events-table'
import { getTrafficEvents } from '@/features/traffic/services/traffic.service'
import { Pagination } from '@/shared/components/pagination'
import { ExportButton } from '@/features/traffic/components/export-button'

export const dynamic = 'force-dynamic'
interface PageProps { searchParams: Promise<Record<string, string>> }

export default async function TrafficPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const hours = 24
  const label = 'últimas 24h'
  const page      = parseInt(sp['page'] ?? '1', 10)
  const PAGE_SIZE = 50
  const from      = new Date(Date.now() - hours * 3_600_000).toISOString()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user!.id).single()
  const orgId     = profile?.org_id ?? ''
  const canExport = ['admin', 'analyst'].includes(profile?.role ?? '')

  const { events, total } = await getTrafficEvents(orgId, {
    from,
    protocol: sp['protocol'], action: sp['action'], severity: sp['severity'],
    srcIp: sp['src_ip'], dstIp: sp['dst_ip'], search: sp['search'],
    page, pageSize: PAGE_SIZE,
  })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={false} />
      <Topbar title="Tráfico de red" subtitle={`${total.toLocaleString()} eventos · ${label}`} />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto mesh-bg">

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TrafficFilters />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0f2038]">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" />
              <h2 className="font-bold text-white text-sm">Eventos de tráfico</h2>
            </div>
            <div className="flex items-center gap-3">
              {canExport && <ExportButton orgId={orgId} filters={{ protocol: sp['protocol'], action: sp['action'], severity: sp['severity'], srcIp: sp['src_ip'], dstIp: sp['dst_ip'], search: sp['search'] }} />}
              <span className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">
                Pág {page} / {totalPages || 1} · {total.toLocaleString()} total
              </span>
            </div>
          </div>
          <div className="p-5"><RecentEventsTable events={events} /></div>
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-[#0f2038]"><Pagination page={page} totalPages={totalPages} /></div>
          )}
        </div>
      </div>
    </div>
  )
}
