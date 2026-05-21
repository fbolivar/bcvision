import { createClient } from '@/lib/supabase/server'

export interface ThreatCategoryCount {
  category: string
  total: number
  blocked: number
  users_affected: number
}

export interface AttackSource {
  src_ip: string
  country: string | null
  count: number
  blocked: number
  threat_categories: string[]
}

export interface GeoAttack {
  country: string
  count: number
  blocked: number
}

export interface SecuritySummary {
  ips_attacks: number
  malware_events: number
  botnet_events: number
  phishing_events: number
  total_blocked: number
  unique_sources: number
}

const IPS_CATEGORIES = ['intrusion', 'exploit', 'scan', 'probe', 'attack', 'ips', 'vulnerability']
const MALWARE_CATEGORIES = ['malware', 'adware', 'spyware', 'ransomware', 'trojan', 'virus', 'worm']
const BOTNET_CATEGORIES = ['botnet', 'c2', 'command-and-control', 'bot']
const PHISHING_CATEGORIES = ['phishing', 'fraud', 'social-engineering', 'credential-theft']

function matchesCategory(cat: string | null, patterns: string[]): boolean {
  if (!cat) return false
  const lower = cat.toLowerCase()
  return patterns.some(p => lower.includes(p))
}

export async function getSecuritySummary(orgId: string, hours = 24): Promise<SecuritySummary> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('threat_category, action, src_ip')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('threat_category', 'is', null)

  const rows = data ?? []
  const uniqueSources = new Set(rows.map(r => r.src_ip).filter(Boolean))

  return {
    ips_attacks:    rows.filter(r => matchesCategory(r.threat_category, IPS_CATEGORIES)).length,
    malware_events: rows.filter(r => matchesCategory(r.threat_category, MALWARE_CATEGORIES)).length,
    botnet_events:  rows.filter(r => matchesCategory(r.threat_category, BOTNET_CATEGORIES)).length,
    phishing_events:rows.filter(r => matchesCategory(r.threat_category, PHISHING_CATEGORIES)).length,
    total_blocked:  rows.filter(r => r.action === 'deny' || r.action === 'drop').length,
    unique_sources: uniqueSources.size,
  }
}

export async function getThreatCategories(orgId: string, hours = 24): Promise<ThreatCategoryCount[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('threat_category, action, user_name')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('threat_category', 'is', null)

  const map = new Map<string, ThreatCategoryCount>()
  for (const row of data ?? []) {
    const cat = row.threat_category ?? 'unknown'
    const existing = map.get(cat)
    const blocked = (row.action === 'deny' || row.action === 'drop') ? 1 : 0
    const user = row.user_name ? 1 : 0
    if (existing) {
      existing.total++
      existing.blocked += blocked
      existing.users_affected += user
    } else {
      map.set(cat, { category: cat, total: 1, blocked, users_affected: user })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 20)
}

export async function getTopAttackSources(orgId: string, hours = 24, limit = 15): Promise<AttackSource[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('src_ip, src_country, action, threat_category')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('threat_category', 'is', null)
    .not('src_ip', 'is', null)

  const map = new Map<string, AttackSource>()
  for (const row of data ?? []) {
    const ip = row.src_ip ?? 'unknown'
    const blocked = (row.action === 'deny' || row.action === 'drop') ? 1 : 0
    const existing = map.get(ip)
    if (existing) {
      existing.count++
      existing.blocked += blocked
      if (row.threat_category && !existing.threat_categories.includes(row.threat_category)) {
        existing.threat_categories.push(row.threat_category)
      }
    } else {
      map.set(ip, {
        src_ip: ip,
        country: row.src_country,
        count: 1,
        blocked,
        threat_categories: row.threat_category ? [row.threat_category] : [],
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, limit)
}

export async function getGeoAttacks(orgId: string, hours = 24): Promise<GeoAttack[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('src_country, action')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('threat_category', 'is', null)
    .not('src_country', 'is', null)

  const map = new Map<string, GeoAttack>()
  for (const row of data ?? []) {
    const country = row.src_country ?? 'Unknown'
    const blocked = (row.action === 'deny' || row.action === 'drop') ? 1 : 0
    const existing = map.get(country)
    if (existing) {
      existing.count++
      existing.blocked += blocked
    } else {
      map.set(country, { country, count: 1, blocked })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 20)
}

export async function getAffectedUsers(orgId: string, hours = 24) {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()

  const { data } = await supabase
    .from('firewall_events')
    .select('user_name, threat_category, action')
    .eq('org_id', orgId)
    .gte('event_time', since)
    .not('threat_category', 'is', null)
    .not('user_name', 'is', null)

  const map = new Map<string, { user_name: string; events: number; categories: Set<string>; blocked: number }>()
  for (const row of data ?? []) {
    const user = row.user_name ?? 'unknown'
    const blocked = (row.action === 'deny' || row.action === 'drop') ? 1 : 0
    const existing = map.get(user)
    if (existing) {
      existing.events++
      existing.blocked += blocked
      if (row.threat_category) existing.categories.add(row.threat_category)
    } else {
      map.set(user, { user_name: user, events: 1, categories: new Set(row.threat_category ? [row.threat_category] : []), blocked })
    }
  }

  return Array.from(map.values())
    .map(u => ({ user_name: u.user_name, events: u.events, blocked: u.blocked, categories: Array.from(u.categories) }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 15)
}
