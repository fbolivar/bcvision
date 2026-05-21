import type { ParsedFirewallEvent, SyslogMessage, EventAction } from '../types'

/**
 * pfSense — formato filterlog CSV o texto
 * filterlog: rule,subrule,anchor,tracker,if,reason,action,dir,ip-version,tos,ecn,ttl,id,offset,flags,proto-id,proto,length,src-ip,dst-ip,src-port,dst-port,data-length
 * Ejemplo: 5,,,1234567890,em0,match,block,in,4,0x00,,64,12345,0,DF,6,tcp,60,1.2.3.4,192.168.1.10,52341,22,0
 */

const FILTERLOG = /^(\d+),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),(pass|block|match),([^,]*),(\d+),/

export function parsePfsense(msg: SyslogMessage): ParsedFirewallEvent {
  const isFilterLog = msg.message.includes('filterlog')

  if (isFilterLog) {
    const csvStart = msg.message.indexOf(': ')
    const csv = csvStart >= 0 ? msg.message.slice(csvStart + 2) : msg.message
    const parts = csv.split(',')

    const action = (parts[6] ?? '') === 'pass' ? 'allow' as EventAction : 'deny' as EventAction
    const protoName = parts[16] ?? ''
    const srcIp = parts[18] ?? null
    const dstIp = parts[19] ?? null
    const srcPort = parts[20] ? parseInt(parts[20], 10) : null
    const dstPort = parts[21] ? parseInt(parts[21], 10) : null

    return {
      event_type: action === 'deny' ? 'block' : 'traffic',
      action,
      protocol: protoName.toUpperCase() || null,
      src_ip: srcIp,
      dst_ip: dstIp,
      src_port: srcPort,
      dst_port: dstPort,
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
      severity: action === 'deny' ? 'low' : 'info',
      parsed_data: { csv, raw: msg.message },
    }
  }

  // Otros logs de pfSense (dhcpd, openvpn, etc.)
  const isVpn = msg.message.toLowerCase().includes('openvpn')
  const isAuth = msg.message.toLowerCase().includes('auth') || msg.message.toLowerCase().includes('login')

  return {
    event_type: isVpn ? 'vpn' : isAuth ? 'auth' : 'system',
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
