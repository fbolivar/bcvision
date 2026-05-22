export type EventType = 'traffic' | 'block' | 'auth' | 'threat' | 'system' | 'vpn' | 'nat'
export type EventAction = 'allow' | 'deny' | 'drop' | 'reset' | 'monitor' | 'redirect'
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type FirewallBrand = 'fortinet' | 'cisco' | 'pfsense' | 'sophos' | 'paloalto' | 'mikrotik' | 'generic'

export interface SyslogMessage {
  facility: number
  severity: number
  timestamp: Date
  hostname: string
  appName: string
  message: string
  raw: string
  sourceIp: string
}

export interface ParsedFirewallEvent {
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
  parsed_data: Record<string, unknown>
  firewall_rule?: string | null
}

export interface AgentConfig {
  bcvision_url: string
  bcvision_api_key: string
  syslog_udp_port: number
  syslog_tcp_port: number
  web_port: number
  agent_name: string
  fortigate_ip?: string
  fortigate_api_token?: string
}

export interface AgentStats {
  startedAt: Date
  messagesReceived: number
  messagesForwarded: number
  messagesFailed: number
  lastMessage: Date | null
  connected: boolean
  lastError: string | null
}
