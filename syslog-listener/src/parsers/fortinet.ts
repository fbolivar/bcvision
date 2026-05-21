import type { ParsedFirewallEvent, SyslogMessage, EventType, EventAction, Severity } from '../types'

/**
 * Fortinet FortiGate — logs en formato key=value
 * Ejemplo: date=2025-01-09 time=14:23:01 devname=FW-01 logid=0000000013
 *          type=traffic subtype=forward level=notice action=accept
 *          srcip=192.168.1.100 dstip=8.8.8.8 srcport=52341 dstport=443
 *          proto=6 sentbyte=1234 rcvdbyte=5678 duration=3
 */

function parseKV(msg: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /(\w+)=(?:"([^"]*)"|(\S+))/g
  let match
  while ((match = regex.exec(msg)) !== null) {
    result[match[1]] = match[2] ?? match[3] ?? ''
  }
  return result
}

function mapAction(action: string | undefined): EventAction | null {
  const map: Record<string, EventAction> = {
    accept: 'allow', allow: 'allow',
    deny: 'deny', block: 'deny',
    drop: 'drop', reset: 'reset',
    monitor: 'monitor', redirect: 'redirect',
  }
  return map[action?.toLowerCase() ?? ''] ?? null
}

function mapEventType(type: string, subtype: string): EventType {
  if (type === 'traffic') return 'traffic'
  if (type === 'utm' || subtype === 'virus' || subtype === 'intrusion') return 'threat'
  if (type === 'event' && subtype === 'vpn') return 'vpn'
  if (type === 'event' && subtype === 'system') return 'system'
  if (type === 'event' && (subtype === 'user' || subtype === 'auth')) return 'auth'
  return 'traffic'
}

function mapSeverity(level: string | undefined): Severity {
  const map: Record<string, Severity> = {
    emergency: 'critical', alert: 'critical', critical: 'critical',
    error: 'high', warning: 'medium', notice: 'low',
    information: 'info', debug: 'info',
  }
  return map[level?.toLowerCase() ?? ''] ?? 'info'
}

export function parsefortinet(msg: SyslogMessage): ParsedFirewallEvent {
  const kv = parseKV(msg.message)

  const action = mapAction(kv['action'])
  const isThreat = kv['type'] === 'utm' || kv['attack'] || kv['virus'] || kv['botnet']

  return {
    event_type: mapEventType(kv['type'] ?? '', kv['subtype'] ?? ''),
    action,
    protocol: kv['proto'] ? protocolNumber(kv['proto']) : kv['service'] ?? null,
    src_ip: kv['srcip'] ?? kv['src'] ?? null,
    dst_ip: kv['dstip'] ?? kv['dst'] ?? null,
    src_port: kv['srcport'] ? parseInt(kv['srcport'], 10) : null,
    dst_port: kv['dstport'] ? parseInt(kv['dstport'], 10) : null,
    src_country: kv['srccountry'] ?? null,
    dst_country: kv['dstcountry'] ?? null,
    bytes_sent: kv['sentbyte'] ? parseInt(kv['sentbyte'], 10) : 0,
    bytes_received: kv['rcvdbyte'] ? parseInt(kv['rcvdbyte'], 10) : 0,
    duration_ms: kv['duration'] ? parseInt(kv['duration'], 10) * 1000 : null,
    user_name: kv['user'] ?? kv['unauthuser'] ?? null,
    url: kv['url'] ?? kv['hostname'] ?? null,
    application: kv['app'] ?? kv['appcat'] ?? null,
    threat_name: kv['attack'] ?? kv['virus'] ?? kv['botnet'] ?? null,
    threat_category: kv['attackid'] ? 'intrusion' : kv['virus'] ? 'malware' : null,
    severity: isThreat ? 'high' : mapSeverity(kv['level']),
    parsed_data: kv,
  }
}

function protocolNumber(proto: string): string {
  const map: Record<string, string> = {
    '6': 'TCP', '17': 'UDP', '1': 'ICMP',
    '47': 'GRE', '50': 'ESP', '89': 'OSPF',
  }
  return map[proto] ?? proto
}
