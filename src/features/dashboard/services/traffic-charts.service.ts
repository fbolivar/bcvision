import { createClient } from '@/lib/supabase/server'

export interface ChartSegment {
  label: string
  value: number
  color: string
}

const COLORS_A = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899']
const COLORS_B = ['#a78bfa', '#34d399', '#fb923c', '#60a5fa', '#f472b6', '#4ade80']
const COLORS_C = ['#06b6d4', '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']
const COLORS_D = ['#ef4444', '#f97316', '#a78bfa', '#34d399', '#60a5fa', '#f472b6']

// Port → friendly name mapping
const PORT_NAMES: Record<number, string> = {
  80: 'HTTP', 443: 'HTTPS', 53: 'DNS', 22: 'SSH', 21: 'FTP',
  25: 'SMTP', 110: 'POP3', 143: 'IMAP', 3389: 'RDP', 3306: 'MySQL',
  5432: 'PostgreSQL', 6379: 'Redis', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt',
  1194: 'OpenVPN', 500: 'IKE', 4500: 'NAT-T', 123: 'NTP', 161: 'SNMP',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  traffic: 'Tráfico general', block: 'Bloqueado', threat: 'Amenaza',
  auth: 'Autenticación', vpn: 'VPN', nat: 'NAT', system: 'Sistema',
}

async function fetchField(orgId: string, field: string, hours = 24, maxRows = 2000) {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()
  const { data } = await supabase
    .from('firewall_events')
    .select(field)
    .eq('org_id', orgId)
    .gte('event_time', since)
    .limit(maxRows)
  return (data ?? []) as unknown as Record<string, unknown>[]
}

function aggregate(rows: Record<string, unknown>[], field: string, labelMap?: Record<string, string>, topN = 6) {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const raw = row[field]
    const key = raw !== null && raw !== undefined ? String(raw) : 'N/A'
    const label = labelMap ? (labelMap[key] ?? key) : key
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, value]) => ({ label, value }))
}

export async function getAppTrafficChart(orgId: string, hours = 24): Promise<ChartSegment[]> {
  const rows = await fetchField(orgId, 'application,dst_port', hours)
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const app  = row['application']
    const port = row['dst_port']
    const label = app
      ? String(app)
      : port !== null && port !== undefined
        ? (PORT_NAMES[Number(port)] ?? `Puerto ${port}`)
        : 'Desconocido'
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({ label, value, color: COLORS_A[i] ?? '#64748b' }))
}

export async function getUrlCategoryChart(orgId: string, hours = 24): Promise<ChartSegment[]> {
  const rows = await fetchField(orgId, 'event_type', hours)
  return aggregate(rows, 'event_type', EVENT_TYPE_LABELS)
    .map((s, i) => ({ ...s, color: COLORS_B[i] ?? '#64748b' }))
}

export async function getSrcIpChart(orgId: string, hours = 24): Promise<ChartSegment[]> {
  const rows = await fetchField(orgId, 'src_ip', hours)
  return aggregate(rows, 'src_ip')
    .map((s, i) => ({ ...s, color: COLORS_C[i] ?? '#64748b' }))
}

export async function getDstIpChart(orgId: string, hours = 24): Promise<ChartSegment[]> {
  const rows = await fetchField(orgId, 'dst_ip', hours)
  return aggregate(rows, 'dst_ip')
    .map((s, i) => ({ ...s, color: COLORS_D[i] ?? '#64748b' }))
}
