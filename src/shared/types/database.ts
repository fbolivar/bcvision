export type OrgPlan = 'free' | 'professional' | 'enterprise'
export type UserRole = 'admin' | 'analyst' | 'viewer'
export type FirewallBrand = 'fortinet' | 'cisco' | 'pfsense' | 'sophos' | 'paloalto' | 'mikrotik' | 'generic'
export type EventType = 'traffic' | 'block' | 'auth' | 'threat' | 'system' | 'vpn' | 'nat'
export type EventAction = 'allow' | 'deny' | 'drop' | 'reset' | 'monitor' | 'redirect'
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'false_positive'
export type ReportType = 'executive' | 'technical' | 'compliance' | 'custom'
export type ReportStatus = 'generating' | 'ready' | 'failed' | 'sent'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: OrgPlan
  max_devices: number
  retention_days: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  org_id: string
  full_name: string | null
  role: UserRole
  email: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Device {
  id: string
  org_id: string
  name: string
  ip_address: string
  brand: FirewallBrand
  model: string | null
  location: string | null
  active: boolean
  last_seen: string | null
  created_at: string
  updated_at: string
}

export interface SyslogRaw {
  id: number
  org_id: string
  device_id: string | null
  received_at: string
  raw_message: string
  source_ip: string
  facility: number | null
  severity: number | null
  created_at: string
}

export interface FirewallEvent {
  id: number
  org_id: string
  device_id: string | null
  raw_id: number | null
  event_time: string
  event_type: EventType
  action: EventAction | null
  protocol: string | null
  src_ip: string | null
  dst_ip: string | null
  src_port: number | null
  dst_port: number | null
  src_country: string | null
  dst_country: string | null
  bytes_sent: number
  bytes_received: number
  duration_ms: number | null
  user_name: string | null
  url: string | null
  application: string | null
  threat_name: string | null
  threat_category: string | null
  severity: Severity
  parsed_data: Record<string, unknown> | null
  firewall_rule: string | null
  src_ip_text: string | null
  dst_ip_text: string | null
  created_at: string
}

export interface Alert {
  id: string
  org_id: string
  event_id: number | null
  device_id: string | null
  type: string
  title: string
  description: string | null
  severity: Severity
  status: AlertStatus
  assigned_to: string | null
  notes: string | null
  created_at: string
  acknowledged_at: string | null
  resolved_at: string | null
  updated_at: string
}

export interface Report {
  id: string
  org_id: string
  created_by: string | null
  type: ReportType
  title: string
  period_start: string
  period_end: string
  generated_at: string
  content_json: Record<string, unknown> | null
  pdf_url: string | null
  sent_to: string[]
  status: ReportStatus
  created_at: string
}

export interface ThreatFeed {
  id: string
  indicator: string
  type: 'ip' | 'domain' | 'url' | 'hash'
  category: string | null
  severity: Severity
  source: string | null
  active: boolean
  expires_at: string | null
  created_at: string
}

// Dashboard stats
export interface DashboardStats {
  total_events_24h: number
  blocked_events_24h: number
  threats_24h: number
  active_devices: number
  critical_alerts: number
  bytes_total_24h: number
}

// Evento con joins
export interface FirewallEventWithDevice extends FirewallEvent {
  device?: Pick<Device, 'name' | 'brand' | 'ip_address'>
}

export interface AlertWithEvent extends Alert {
  firewall_event?: Pick<FirewallEvent, 'event_type' | 'src_ip' | 'dst_ip' | 'severity'>
  device?: Pick<Device, 'name' | 'brand'>
  user?: Pick<UserProfile, 'full_name' | 'email'>
}
