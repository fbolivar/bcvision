import type { ParsedFirewallEvent, SyslogMessage, EventType, EventAction, Severity } from '../types'

/**
 * Cisco ASA — formato: %ASA-severity-msgid: message_text
 * Ejemplos:
 *   %ASA-6-302013: Built inbound TCP connection 12345 for outside:1.2.3.4/80 to inside:192.168.1.10/49152
 *   %ASA-4-106023: Deny tcp src outside:1.2.3.4/80 dst inside:192.168.1.10/443 by access-group "outside_access"
 *   %ASA-2-106001: Inbound TCP connection denied from 1.2.3.4/80 to 192.168.1.10/443 flags SYN on interface outside
 */

const ASA_HEADER = /%ASA-(\d)-(\d+):\s*(.*)/

// Patrones de mensajes comunes
const BUILT_CONN    = /Built\s+\w+\s+(\w+)\s+connection\s+\d+\s+for\s+\w+:(\S+?)\/(\d+)\s+to\s+\w+:(\S+?)\/(\d+)/i
const DENY_CONN     = /Deny\s+(\w+)\s+src\s+\w+:(\S+?)\/(\d+)\s+dst\s+\w+:(\S+?)\/(\d+)/i
const TEARDOWN_CONN = /Teardown\s+\w+\s+(\w+)\s+connection\s+\d+.+Duration\s+([\d:]+)\s+Bytes\s+(\d+)/i

function asaSeverity(level: string): Severity {
  const n = parseInt(level, 10)
  if (n <= 1) return 'critical'
  if (n === 2) return 'high'
  if (n === 3) return 'medium'
  if (n === 4) return 'low'
  return 'info'
}

function parseDuration(hhmmss: string): number {
  const parts = hhmmss.split(':').map(p => parseInt(p, 10))
  return ((parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)) * 1000
}

export function parseCisco(msg: SyslogMessage): ParsedFirewallEvent {
  const headerMatch = ASA_HEADER.exec(msg.message)

  const severity: Severity = headerMatch ? asaSeverity(headerMatch[1]) : 'info'
  const msgId = headerMatch ? headerMatch[2] : ''
  const body = headerMatch ? headerMatch[3] : msg.message

  let event_type: EventType = 'traffic'
  let action: EventAction | null = null
  let protocol: string | null = null
  let src_ip: string | null = null
  let dst_ip: string | null = null
  let src_port: number | null = null
  let dst_port: number | null = null
  let bytes_sent = 0
  let duration_ms: number | null = null

  const builtMatch = BUILT_CONN.exec(body)
  if (builtMatch) {
    action = 'allow'
    protocol = builtMatch[1].toUpperCase()
    src_ip = builtMatch[2]
    src_port = parseInt(builtMatch[3], 10)
    dst_ip = builtMatch[4]
    dst_port = parseInt(builtMatch[5], 10)
  }

  const denyMatch = DENY_CONN.exec(body)
  if (denyMatch) {
    action = 'deny'
    event_type = 'block'
    protocol = denyMatch[1].toUpperCase()
    src_ip = denyMatch[2]
    src_port = parseInt(denyMatch[3], 10)
    dst_ip = denyMatch[4]
    dst_port = parseInt(denyMatch[5], 10)
  }

  const teardownMatch = TEARDOWN_CONN.exec(body)
  if (teardownMatch) {
    protocol = teardownMatch[1].toUpperCase()
    duration_ms = parseDuration(teardownMatch[2])
    bytes_sent = parseInt(teardownMatch[3], 10)
  }

  // Detectar eventos de auth / threat por msgId
  if (msgId === '113015' || msgId === '113014') event_type = 'auth'
  if (msgId.startsWith('400')) event_type = 'threat'

  const isBlock = action === 'deny' || action === null
  const isThreat = event_type === 'threat' || severity === 'critical' || severity === 'high'

  return {
    event_type: isBlock ? 'block' : isThreat ? 'threat' : event_type,
    action,
    protocol,
    src_ip,
    dst_ip,
    src_port,
    dst_port,
    src_country: null,
    dst_country: null,
    bytes_sent,
    bytes_received: 0,
    duration_ms,
    user_name: null,
    url: null,
    application: null,
    threat_name: event_type === 'threat' ? `ASA-${msgId}` : null,
    threat_category: event_type === 'threat' ? 'intrusion' : null,
    severity,
    parsed_data: { msgId, body, raw: msg.message },
  }
}
