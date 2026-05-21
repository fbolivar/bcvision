import { Activity, Shield, AlertTriangle, Monitor, TrendingUp, Database } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/shared/components/topbar'
import { TimeFilter } from '@/shared/components/time-filter'
import { resolveHours } from '@/shared/lib/time'
import { LiveRefresh } from '@/shared/components/live-refresh'
import { StatCard } from '@/features/dashboard/components/stat-card'
import { RecentEventsTable } from '@/features/dashboard/components/recent-events-table'
import { DeviceStatusCard } from '@/features/dashboard/components/device-status-card'
import { LiveEventsWidget } from '@/features/dashboard/components/live-events-widget'
import { DonutChartWidget } from '@/features/dashboard/components/donut-chart-widget'
import { UrlCategoryTable } from '@/features/dashboard/components/url-category-table'
import { UserIpTable } from '@/features/dashboard/components/user-ip-table'
import { getDashboardStats, getRecentEvents } from '@/features/dashboard/services/dashboard.service'
import { getAppTrafficChart, getUrlCategoryChart, getSrcIpChart, getDstIpChart } from '@/features/dashboard/services/traffic-charts.service'
import { getUrlCategoryTable, getUserIpTable } from '@/features/dashboard/services/top-tables.service'
import { formatBytes, formatNumber } from '@/shared/lib/utils'
import type { Device } from '@/shared/types/database'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
interface PageProps { searchParams: Promise<Record<string, string>> }

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { hours, isLive, param, label } = resolveHours(sp['hours'])

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user!.id).single()

  if (profile?.role === 'super_admin') redirect('/admin')

  const orgId = profile?.org_id ?? ''

  const [stats, recentEvents, devicesRes, appChart, urlChart, srcIpChart, dstIpChart, urlCatTable, userIpTableData] = await Promise.all([
    getDashboardStats(orgId, hours),
    getRecentEvents(orgId, 5),
    supabase.from('devices').select('*').eq('org_id', orgId).eq('active', true).order('last_seen', { ascending: false }),
    getAppTrafficChart(orgId, hours),
    getUrlCategoryChart(orgId, hours),
    getSrcIpChart(orgId, hours),
    getDstIpChart(orgId, hours),
    getUrlCategoryTable(orgId, hours),
    getUserIpTable(orgId, hours),
  ])

  const devices = (devicesRes.data ?? []) as Device[]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LiveRefresh enabled={isLive} />
      <Topbar title="Dashboard" subtitle={`Resumen de actividad · ${label}`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto mesh-bg">

        {/* Time filter */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#334155] font-medium">Período de análisis</span>
          <TimeFilter current={param} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard title="Eventos"    value={formatNumber(stats.total_events_24h)}       icon={Activity}      variant="default"  />
          <StatCard title="Bloqueados"  value={formatNumber(stats.blocked_events_24h)}     icon={Shield}        variant="warning"  />
          <StatCard title="Amenazas"    value={formatNumber(stats.threats_24h)}            icon={TrendingUp}    variant="critical" />
          <StatCard title="Dispositivos" value={`${stats.active_devices}`} subtitle="activos" icon={Monitor}    variant="success"  />
          <StatCard title="Alertas críticas" value={`${stats.critical_alerts}`} subtitle="abiertas" icon={AlertTriangle} variant="critical" />
          <StatCard title="Tráfico total" value={formatBytes(stats.bytes_total_24h)}       icon={Database}      variant="cyan"     />
        </div>

        {/* Devices */}
        {devices.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#22c55e] to-[#16a34a]" />
              <h2 className="text-sm font-bold text-white">Dispositivos activos</h2>
              <span className="text-xs text-[#334155] ml-1">{devices.length} online</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {devices.map(d => <DeviceStatusCard key={d.id} device={d} />)}
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl border border-dashed border-[#1e3a5f] p-10 text-center overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-50" />
            <Monitor className="w-10 h-10 text-[#1e3a5f] mx-auto mb-3" />
            <p className="text-[#64748b] font-semibold text-sm">Sin dispositivos registrados</p>
            <p className="text-[#334155] text-xs mt-1 mb-4">
              Conecta tu primer firewall vía Syslog para comenzar el monitoreo
            </p>
            <Link href="/devices"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/25 text-[#60a5fa] text-xs font-semibold hover:bg-[#3b82f6]/20 transition-colors">
              Agregar dispositivo →
            </Link>
          </div>
        )}

        {/* Traffic charts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#06b6d4]" />
            <h2 className="text-sm font-bold text-white">Análisis de tráfico · {label}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DonutChartWidget title="Aplicaciones" data={appChart} />
            <DonutChartWidget title="Categorías de URL" data={urlChart} />
            <DonutChartWidget title="IPs Origen" data={srcIpChart} />
            <DonutChartWidget title="IPs Destino" data={dstIpChart} />
          </div>
        </div>

        {/* Top tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <UrlCategoryTable data={urlCatTable} />
          <UserIpTable data={userIpTableData} />
        </div>

        {/* Events + Live */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#0f2038]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#3b82f6] to-[#8b5cf6]" />
                <h2 className="font-bold text-white text-sm">Eventos recientes</h2>
              </div>
              <span className="text-[10px] font-bold text-[#334155] uppercase tracking-wider">{recentEvents.length} eventos</span>
            </div>
            <div className="p-5">
              <RecentEventsTable events={recentEvents} />
            </div>
          </div>
          <LiveEventsWidget orgId={orgId} />
        </div>
      </div>
    </div>
  )
}
