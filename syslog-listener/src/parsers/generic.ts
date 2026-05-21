import type { ParsedFirewallEvent, SyslogMessage } from '../types'

/**
 * Parser genérico — extrae IPs y puertos con regex básico
 * para dispositivos no soportados explícitamente
 */

const IP_PORT = /(\d{1,3}(?:\.\d{1,3}){3})(?::(\d+))?/g

export function parseGeneric(msg: SyslogMessage): ParsedFirewallEvent {
  const ips: Array<{ ip: string; port: number | null }> = []
  let match
  const regex = new RegExp(IP_PORT.source, 'g')

  while ((match = regex.exec(msg.message)) !== null) {
    ips.push({ ip: match[1], port: match[2] ? parseInt(match[2], 10) : null })
  }

  const lower = msg.message.toLowerCase()
  const isBlock   = lower.includes('block') || lower.includes('deny') || lower.includes('drop') || lower.includes('reject')
  const isThreat  = lower.includes('threat') || lower.includes('attack') || lower.includes('virus') || lower.includes('malware')
  const isAuth    = lower.includes('auth') || lower.includes('login') || lower.includes('password')

  return {
    event_type: isThreat ? 'threat' : isBlock ? 'block' : isAuth ? 'auth' : 'traffic',
    action: isBlock ? 'deny' : null,
    protocol: null,
    src_ip: ips[0]?.ip ?? null,
    dst_ip: ips[1]?.ip ?? null,
    src_port: ips[0]?.port ?? null,
    dst_port: ips[1]?.port ?? null,
    src_country: null,
    dst_country: null,
    bytes_sent: 0,
    bytes_received: 0,
    duration_ms: null,
    user_name: null,
    url: null,
    application: null,
    threat_name: isThreat ? 'Unknown threat' : null,
    threat_category: isThreat ? 'unknown' : null,
    severity: isThreat ? 'medium' : isBlock ? 'low' : 'info',
    parsed_data: { raw: msg.message },
  }
}
