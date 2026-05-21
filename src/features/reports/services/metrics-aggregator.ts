import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Helpers de clasificación de threat_category
function matchesCat(cat: string | null, keywords: string[]) {
  if (!cat) return false
  const l = cat.toLowerCase()
  return keywords.some(k => l.includes(k))
}
const IS_INTRUSION = (c: string | null) => matchesCat(c, ['intrusion','exploit','scan','probe','attack','ips','vulnerability'])
const IS_MALWARE   = (c: string | null) => matchesCat(c, ['malware','ransomware','trojan','virus','worm'])
const IS_ADWARE    = (c: string | null) => matchesCat(c, ['adware'])
const IS_SPYWARE   = (c: string | null) => matchesCat(c, ['spyware'])
const IS_BOTNET    = (c: string | null) => matchesCat(c, ['botnet','c2','command-and-control','bot'])
const IS_PHISHING  = (c: string | null) => matchesCat(c, ['phishing','fraud','social-engineering','credential'])

function riskLevel(sev: string): number {
  return ({ critical: 5, high: 4, medium: 3, low: 2, info: 1 } as Record<string, number>)[sev] ?? 2
}

export interface ReportMetrics {
  period: { start: string; end: string; days: number }
  organization: { name: string; plan: string }
  summary: {
    total_events: number
    blocked_events: number
    threat_events: number
    allowed_events: number
    block_rate_pct: number
    bytes_total: number
    bytes_sent: number
    bytes_received: number
    active_devices: number
  }
  severity_breakdown: Record<string, number>
  event_type_breakdown: Record<string, number>

  // IPS / Intrusión
  intrusion_top: Array<{ name: string; count: number; blocked: number; category: string | null }>
  intrusion_not_blocked: Array<{ name: string; count: number; category: string | null }>
  attack_src_ips: Array<{ ip: string; count: number; blocked: number }>
  attack_src_countries: Array<{ country: string; count: number }>
  users_hit_intrusion: Array<{ user_or_ip: string; count: number }>

  // Malware / Adware / Spyware
  users_hit_malware:  Array<{ user_or_ip: string; count: number }>
  users_hit_adware:   Array<{ user_or_ip: string; count: number }>
  users_hit_spyware:  Array<{ user_or_ip: string; count: number }>

  // Botnet / Phishing
  botnet_sources:  Array<{ src_ip: string; count: number }>
  phishing_users:  Array<{ user_or_ip: string; count: number }>

  // Aplicaciones
  top_apps_blocked: Array<{ app: string; count: number }>
  proxy_users: Array<{ user_or_ip: string; sessions: number; bytes: number }>
  top_apps_by_category: Array<{ risk: number; app: string; category: string; technology: string; bandwidth: number; sessions: number }>

  // VPN
  vpn_ssl_users: Array<{ user: string; ip: string | null; first_used: string; bytes_sent: number; bytes_received: number }>
  vpn_failed_logins: Array<{ user: string; type: string; count: number }>

  // Timeline
  session_history: Array<{ date: string; sessions: number }>

  // Estadísticas de tráfico (tabla resumen tipo FortiAnalyzer)
  traffic_stats: {
    total_users: number
    total_apps: number
    total_sessions: number
    most_active_date: string
    bytes_total: number
    total_destinations: number
    avg_sessions_per_day: number
    avg_bytes_per_day: number
  }

  // Legacy (mantener compatibilidad con reporte ejecutivo/cumplimiento)
  top_threats: Array<{ name: string; count: number; category: string | null }>
  top_blocked_ips: Array<{ ip: string; count: number }>
  top_users: Array<{ user: string; events: number; bytes: number; blocked: number }>
  top_dst_countries: Array<{ country: string; count: number }>
  top_protocols: Array<{ protocol: string; count: number }>
  top_dst_ports: Array<{ port: number; count: number }>
  hourly_distribution: Array<{ hour: number; count: number }>
  devices: Array<{ name: string; brand: string; events: number; threats: number; last_seen: string | null }>
  critical_events_sample: Array<{
    time: string; type: string; src_ip: string | null
    dst_ip: string | null; threat: string | null; severity: string
  }>
}

export async function aggregateReportMetrics(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<ReportMetrics> {
  const supabase = getAdminClient()
  const start = new Date(periodStart).toISOString()
  const end   = new Date(periodEnd + 'T23:59:59').toISOString()
  const days  = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000))

  const [orgRes, eventsRes, devicesRes, criticalRes] = await Promise.all([
    supabase.from('organizations').select('name, plan').eq('id', orgId).single(),
    supabase.from('firewall_events')
      .select('event_type,action,severity,protocol,src_ip,dst_ip,dst_port,src_country,dst_country,user_name,application,bytes_sent,bytes_received,threat_name,threat_category,event_time')
      .eq('org_id', orgId)
      .gte('event_time', start)
      .lte('event_time', end),
    supabase.from('devices').select('name,brand,last_seen').eq('org_id', orgId).eq('active', true),
    supabase.from('firewall_events')
      .select('event_time,event_type,src_ip,dst_ip,threat_name,severity')
      .eq('org_id', orgId)
      .in('severity', ['critical','high'])
      .gte('event_time', start)
      .lte('event_time', end)
      .order('event_time', { ascending: false })
      .limit(10),
  ])

  const events  = eventsRes.data  ?? []
  const org     = orgRes.data     ?? { name: 'Organización', plan: 'free' }
  const devices = devicesRes.data ?? []

  // ── Contadores principales ────────────────────────────────
  const total    = events.length
  const blocked  = events.filter(e => e.action === 'deny' || e.action === 'drop').length
  const threats  = events.filter(e => e.event_type === 'threat').length
  const allowed  = events.filter(e => e.action === 'allow').length
  const bytesSent     = events.reduce((a, e) => a + (e.bytes_sent     ?? 0), 0)
  const bytesReceived = events.reduce((a, e) => a + (e.bytes_received ?? 0), 0)

  // ── Maps de agregación ────────────────────────────────────
  const severity_breakdown: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  const event_type_breakdown: Record<string, number> = {}
  const threatMap:    Record<string, { count: number; blocked: number; category: string | null }> = {}
  const blockedIpMap: Record<string, number> = {}
  const userMap:      Record<string, { events: number; bytes: number; blocked: number }> = {}
  const dstCountryMap:Record<string, number> = {}
  const srcCountryMap:Record<string, number> = {}
  const protocolMap:  Record<string, number> = {}
  const portMap:      Record<number, number> = {}
  const hourMap:      Record<number, number> = {}
  const dailyMap:     Record<string, number> = {}

  // IPS
  const intrusionMap:    Record<string, { count: number; blocked: number; category: string | null }> = {}
  const attackSrcIpMap:  Record<string, { count: number; blocked: number }> = {}
  const attackSrcCountryMap: Record<string, number> = {}
  const usersHitIntrusionMap: Record<string, number> = {}

  // Malware / Adware / Spyware / Botnet / Phishing
  const usersHitMalwareMap:  Record<string, number> = {}
  const usersHitAdwareMap:   Record<string, number> = {}
  const usersHitSpywareMap:  Record<string, number> = {}
  const botnetSrcIpMap:      Record<string, number> = {}
  const phishingUsersMap:    Record<string, number> = {}

  // Aplicaciones
  const appsBlockedMap:  Record<string, number> = {}
  const proxyUserMap:    Record<string, { sessions: number; bytes: number }> = {}
  const appCategoryMap:  Record<string, { sessions: number; bandwidth: number; risk: number; category: string; technology: string }> = {}

  // VPN
  const vpnUserMap: Record<string, { ip: string | null; first_used: string; bytes_sent: number; bytes_received: number }> = {}
  const vpnFailedMap: Record<string, number> = {}

  // Destinos únicos
  const uniqueDsts = new Set<string>()
  const uniqueApps = new Set<string>()
  const uniqueUsers = new Set<string>()

  for (const e of events) {
    const isBlocked = e.action === 'deny' || e.action === 'drop'
    const bytes = (e.bytes_sent ?? 0) + (e.bytes_received ?? 0)

    severity_breakdown[e.severity] = (severity_breakdown[e.severity] ?? 0) + 1
    event_type_breakdown[e.event_type] = (event_type_breakdown[e.event_type] ?? 0) + 1

    if (e.threat_name) {
      if (!threatMap[e.threat_name]) threatMap[e.threat_name] = { count: 0, blocked: 0, category: e.threat_category }
      threatMap[e.threat_name].count++
      if (isBlocked) threatMap[e.threat_name].blocked++
    }

    if (isBlocked && e.src_ip) blockedIpMap[e.src_ip] = (blockedIpMap[e.src_ip] ?? 0) + 1

    if (e.user_name) {
      uniqueUsers.add(e.user_name)
      if (!userMap[e.user_name]) userMap[e.user_name] = { events: 0, bytes: 0, blocked: 0 }
      userMap[e.user_name].events++
      userMap[e.user_name].bytes += bytes
      if (isBlocked) userMap[e.user_name].blocked++
    }

    if (e.dst_country) dstCountryMap[e.dst_country] = (dstCountryMap[e.dst_country] ?? 0) + 1
    if (e.protocol)    protocolMap[e.protocol]       = (protocolMap[e.protocol]       ?? 0) + 1
    if (e.dst_port)    portMap[e.dst_port]            = (portMap[e.dst_port]            ?? 0) + 1
    if (e.dst_ip)      uniqueDsts.add(e.dst_ip)
    if (e.application) uniqueApps.add(e.application)

    const hour = new Date(e.event_time).getUTCHours()
    hourMap[hour] = (hourMap[hour] ?? 0) + 1
    const dateKey = e.event_time.slice(0, 10)
    dailyMap[dateKey] = (dailyMap[dateKey] ?? 0) + 1

    // ── IPS / Intrusión ────────────────────────────────────
    if (IS_INTRUSION(e.threat_category)) {
      const key = e.threat_name ?? e.threat_category ?? 'Desconocido'
      if (!intrusionMap[key]) intrusionMap[key] = { count: 0, blocked: 0, category: e.threat_category }
      intrusionMap[key].count++
      if (isBlocked) intrusionMap[key].blocked++

      if (e.src_ip) {
        if (!attackSrcIpMap[e.src_ip]) attackSrcIpMap[e.src_ip] = { count: 0, blocked: 0 }
        attackSrcIpMap[e.src_ip].count++
        if (isBlocked) attackSrcIpMap[e.src_ip].blocked++
      }
      if (e.src_country) attackSrcCountryMap[e.src_country] = (attackSrcCountryMap[e.src_country] ?? 0) + 1

      const victim = e.user_name ?? e.dst_ip ?? 'Desconocido'
      usersHitIntrusionMap[victim] = (usersHitIntrusionMap[victim] ?? 0) + 1
    }

    // ── Malware / Adware / Spyware ─────────────────────────
    if (IS_MALWARE(e.threat_category)) {
      const v = e.user_name ?? e.dst_ip ?? 'Desconocido'
      usersHitMalwareMap[v] = (usersHitMalwareMap[v] ?? 0) + 1
    }
    if (IS_ADWARE(e.threat_category)) {
      const v = e.user_name ?? e.dst_ip ?? 'Desconocido'
      usersHitAdwareMap[v] = (usersHitAdwareMap[v] ?? 0) + 1
    }
    if (IS_SPYWARE(e.threat_category)) {
      const v = e.user_name ?? e.dst_ip ?? 'Desconocido'
      usersHitSpywareMap[v] = (usersHitSpywareMap[v] ?? 0) + 1
    }

    // ── Botnet / Phishing ──────────────────────────────────
    if (IS_BOTNET(e.threat_category) && e.src_ip) {
      botnetSrcIpMap[e.src_ip] = (botnetSrcIpMap[e.src_ip] ?? 0) + 1
    }
    if (IS_PHISHING(e.threat_category)) {
      const v = e.user_name ?? e.src_ip ?? 'Desconocido'
      phishingUsersMap[v] = (phishingUsersMap[v] ?? 0) + 1
    }

    // ── Aplicaciones ───────────────────────────────────────
    if (e.application) {
      if (isBlocked) appsBlockedMap[e.application] = (appsBlockedMap[e.application] ?? 0) + 1

      // Proxy: aplicaciones cuya categoría/nombre sugiere proxy
      const appLow = e.application.toLowerCase()
      if (appLow.includes('proxy') || appLow.includes('tunnel') || appLow.includes('vpn')) {
        const u = e.user_name ?? e.src_ip ?? 'Desconocido'
        if (!proxyUserMap[u]) proxyUserMap[u] = { sessions: 0, bytes: 0 }
        proxyUserMap[u].sessions++
        proxyUserMap[u].bytes += bytes
      }

      // Categoría / tecnología derivada de protocolo
      const category = e.threat_category ?? (e.protocol ? `${e.protocol.toUpperCase()}.Service` : 'General')
      const technology = e.protocol ?? 'Client-Server'
      const risk = riskLevel(e.severity)

      if (!appCategoryMap[e.application]) {
        appCategoryMap[e.application] = { sessions: 0, bandwidth: 0, risk, category, technology }
      }
      appCategoryMap[e.application].sessions++
      appCategoryMap[e.application].bandwidth += bytes
      if (risk > appCategoryMap[e.application].risk) appCategoryMap[e.application].risk = risk
    }

    // ── VPN ────────────────────────────────────────────────
    if (e.event_type === 'vpn') {
      const u = e.user_name ?? e.src_ip ?? 'Desconocido'
      if (!vpnUserMap[u]) {
        vpnUserMap[u] = { ip: e.src_ip, first_used: e.event_time, bytes_sent: 0, bytes_received: 0 }
      }
      vpnUserMap[u].bytes_sent     += e.bytes_sent     ?? 0
      vpnUserMap[u].bytes_received += e.bytes_received ?? 0
      if (e.event_time < vpnUserMap[u].first_used) vpnUserMap[u].first_used = e.event_time

      if (isBlocked) vpnFailedMap[u] = (vpnFailedMap[u] ?? 0) + 1
    }
  }

  // ── Fecha más activa ──────────────────────────────────────
  const mostActiveDate = Object.entries(dailyMap)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? periodStart

  // ── Session history (diario) ──────────────────────────────
  const sessionHistory = Object.entries(dailyMap)
    .map(([date, sessions]) => ({ date, sessions }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── Device stats ──────────────────────────────────────────
  const deviceStats = await Promise.all(
    devices.map(async d => {
      const { count: evtCount } = await supabase
        .from('firewall_events').select('id', { count: 'exact', head: true })
        .eq('org_id', orgId).gte('event_time', start).lte('event_time', end)
      const { count: thrCount } = await supabase
        .from('firewall_events').select('id', { count: 'exact', head: true })
        .eq('org_id', orgId).eq('event_type', 'threat').gte('event_time', start).lte('event_time', end)
      return { name: d.name, brand: d.brand, events: evtCount ?? 0, threats: thrCount ?? 0, last_seen: d.last_seen }
    })
  )

  const bytesTotal = bytesSent + bytesReceived

  return {
    period: { start: periodStart, end: periodEnd, days },
    organization: org,
    summary: {
      total_events: total,
      blocked_events: blocked,
      threat_events: threats,
      allowed_events: allowed,
      block_rate_pct: total > 0 ? Math.round((blocked / total) * 100) : 0,
      bytes_total: bytesTotal,
      bytes_sent: bytesSent,
      bytes_received: bytesReceived,
      active_devices: devices.length,
    },
    severity_breakdown,
    event_type_breakdown,

    // IPS
    intrusion_top: Object.entries(intrusionMap)
      .map(([name, v]) => ({ name, count: v.count, blocked: v.blocked, category: v.category }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    intrusion_not_blocked: Object.entries(intrusionMap)
      .filter(([, v]) => v.blocked < v.count)
      .map(([name, v]) => ({ name, count: v.count - v.blocked, category: v.category }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    attack_src_ips: Object.entries(attackSrcIpMap)
      .map(([ip, v]) => ({ ip, count: v.count, blocked: v.blocked }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    attack_src_countries: Object.entries(attackSrcCountryMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    users_hit_intrusion: Object.entries(usersHitIntrusionMap)
      .map(([user_or_ip, count]) => ({ user_or_ip, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),

    // Malware / Adware / Spyware
    users_hit_malware:  Object.entries(usersHitMalwareMap).map(([u, c]) => ({ user_or_ip: u, count: c })).sort((a, b) => b.count - a.count).slice(0, 10),
    users_hit_adware:   Object.entries(usersHitAdwareMap).map(([u, c]) => ({ user_or_ip: u, count: c })).sort((a, b) => b.count - a.count).slice(0, 10),
    users_hit_spyware:  Object.entries(usersHitSpywareMap).map(([u, c]) => ({ user_or_ip: u, count: c })).sort((a, b) => b.count - a.count).slice(0, 10),

    // Botnet / Phishing
    botnet_sources: Object.entries(botnetSrcIpMap).map(([src_ip, count]) => ({ src_ip, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    phishing_users: Object.entries(phishingUsersMap).map(([u, c]) => ({ user_or_ip: u, count: c })).sort((a, b) => b.count - a.count).slice(0, 10),

    // Aplicaciones
    top_apps_blocked: Object.entries(appsBlockedMap).map(([app, count]) => ({ app, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    proxy_users: Object.entries(proxyUserMap).map(([u, v]) => ({ user_or_ip: u, sessions: v.sessions, bytes: v.bytes })).sort((a, b) => b.bytes - a.bytes).slice(0, 10),
    top_apps_by_category: Object.entries(appCategoryMap)
      .map(([app, v]) => ({ risk: v.risk, app, category: v.category, technology: v.technology, bandwidth: v.bandwidth, sessions: v.sessions }))
      .sort((a, b) => b.bandwidth - a.bandwidth).slice(0, 15),

    // VPN
    vpn_ssl_users: Object.entries(vpnUserMap)
      .map(([user, v]) => ({ user, ip: v.ip, first_used: v.first_used, bytes_sent: v.bytes_sent, bytes_received: v.bytes_received }))
      .sort((a, b) => (b.bytes_sent + b.bytes_received) - (a.bytes_sent + a.bytes_received)).slice(0, 10),
    vpn_failed_logins: Object.entries(vpnFailedMap)
      .map(([user, count]) => ({ user, type: 'ssl-web', count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),

    // Timeline
    session_history: sessionHistory,

    // Estadísticas de tráfico
    traffic_stats: {
      total_users:          uniqueUsers.size,
      total_apps:           uniqueApps.size,
      total_sessions:       total,
      most_active_date:     mostActiveDate,
      bytes_total:          bytesTotal,
      total_destinations:   uniqueDsts.size,
      avg_sessions_per_day: Math.round(total / days),
      avg_bytes_per_day:    Math.round(bytesTotal / days),
    },

    // Legacy
    top_threats: Object.entries(threatMap)
      .map(([name, v]) => ({ name, count: v.count, category: v.category }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    top_blocked_ips: Object.entries(blockedIpMap)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    top_users: Object.entries(userMap)
      .map(([user, v]) => ({ user, ...v }))
      .sort((a, b) => b.bytes - a.bytes).slice(0, 10),
    top_dst_countries: Object.entries(dstCountryMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    top_protocols: Object.entries(protocolMap)
      .map(([protocol, count]) => ({ protocol, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8),
    top_dst_ports: Object.entries(portMap)
      .map(([port, count]) => ({ port: Number(port), count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    hourly_distribution: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] ?? 0 })),
    devices: deviceStats,
    critical_events_sample: (criticalRes.data ?? []).map(e => ({
      time: e.event_time, type: e.event_type,
      src_ip: e.src_ip, dst_ip: e.dst_ip,
      threat: e.threat_name, severity: e.severity,
    })),
  }
}
