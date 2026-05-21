import type { ParsedFirewallEvent, SyslogMessage, EventAction } from '../types'

/**
 * MikroTik RouterOS — formato propio
 * Ejemplos:
 *   firewall,info forward: in:ether1 out:ether2 src-mac=aa:bb:cc:dd:ee:ff
 *     proto=TCP (SYN), 1.2.3.4:52341->192.168.1.10:443, len 60
 *   firewall,info input: in:ether1 src-mac=aa:bb:cc:dd:ee:ff
 *     proto=UDP, 1.2.3.4:1194->192.168.1.1:1194, len 32
 */

const TRAFFIC_PATTERN = /proto=(\w+)(?:\s+\(\w+\))?,\s+([\d.]+):(\d+)->([\d.]+):(\d+)/
const ACTION_PATTERN  = /(forward|input|output|drop|reject|accept)/i

export function parseMikrotik(msg: SyslogMessage): ParsedFirewallEvent {
  const trafficMatch = TRAFFIC_PATTERN.exec(msg.message)
  const actionMatch  = ACTION_PATTERN.exec(msg.message)

  const rawAction = (actionMatch?.[1] ?? '').toLowerCase()
  let action: EventAction | null = null
  if (rawAction === 'forward' || rawAction === 'accept') action = 'allow'
  if (rawAction === 'drop') action = 'drop'
  if (rawAction === 'reject') action = 'deny'

  const isBlock = action === 'drop' || action === 'deny'
  const isVpn = msg.message.toLowerCase().includes('ovpn') ||
                msg.message.toLowerCase().includes('l2tp') ||
                msg.message.toLowerCase().includes('pppoe')

  if (trafficMatch) {
    return {
      event_type: isVpn ? 'vpn' : isBlock ? 'block' : 'traffic',
      action,
      protocol: trafficMatch[1].toUpperCase(),
      src_ip: trafficMatch[2],
      dst_ip: trafficMatch[4],
      src_port: parseInt(trafficMatch[3], 10),
      dst_port: parseInt(trafficMatch[5], 10),
      src_country: null,
      dst_country: null,
      bytes_sent: 0,
      bytes_received: 0,
      duration_ms: null,
      user_name: null,
      url: null,
      application: null,
      threat_name: null,
      threat_category: null,
      severity: isBlock ? 'low' : 'info',
      parsed_data: { raw: msg.message },
    }
  }

  return {
    event_type: isVpn ? 'vpn' : 'system',
    action: null,
    protocol: null,
    src_ip: null, dst_ip: null, src_port: null, dst_port: null,
    src_country: null, dst_country: null,
    bytes_sent: 0, bytes_received: 0, duration_ms: null,
    user_name: null, url: null, application: null,
    threat_name: null, threat_category: null,
    severity: 'info',
    parsed_data: { raw: msg.message },
  }
}
