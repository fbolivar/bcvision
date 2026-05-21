import type { ParsedFirewallEvent, SyslogMessage, EventType, EventAction, Severity } from '../types'

/**
 * Sophos XG Firewall — formato key=value similar a Fortinet
 * Ejemplo: device="SFW" date=2025-01-09 time=14:23:01 timezone="COT" device_name="XG230"
 *          log_id=010202601001 log_type="Firewall" log_component="Firewall Rule"
 *          log_subtype="Denied" status="Deny" duration=0
 *          sent_bytes=0 recv_bytes=0 tran_src_ip=1.2.3.4 src_port=52341 dst_port=443
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

export function parseSophos(msg: SyslogMessage): ParsedFirewallEvent {
  const kv = parseKV(msg.message)

  const logType = kv['log_type'] ?? ''
  const logSubtype = kv['log_subtype'] ?? ''
  const status = (kv['status'] ?? '').toLowerCase()

  let event_type: EventType = 'traffic'
  if (logType === 'IDP') event_type = 'threat'
  else if (logType === 'Anti-Virus') event_type = 'threat'
  else if (logType === 'Web') event_type = 'traffic'
  else if (logSubtype === 'Denied' || status === 'deny') event_type = 'block'
  else if (logType === 'Event' && logSubtype === 'Authentication') event_type = 'auth'

  const action: EventAction | null =
    status === 'allow' ? 'allow' :
    status === 'deny'  ? 'deny' :
    status === 'drop'  ? 'drop' : null

  const severity: Severity =
    logType === 'IDP' || logType === 'Anti-Virus' ? 'high' :
    status === 'deny' ? 'low' : 'info'

  return {
    event_type,
    action,
    protocol: kv['protocol'] ?? kv['proto'] ?? null,
    src_ip: kv['src_ip'] ?? kv['tran_src_ip'] ?? null,
    dst_ip: kv['dst_ip'] ?? kv['tran_dst_ip'] ?? null,
    src_port: kv['src_port'] ? parseInt(kv['src_port'], 10) : null,
    dst_port: kv['dst_port'] ? parseInt(kv['dst_port'], 10) : null,
    src_country: kv['src_country'] ?? null,
    dst_country: kv['dst_country'] ?? null,
    bytes_sent: kv['sent_bytes'] ? parseInt(kv['sent_bytes'], 10) : 0,
    bytes_received: kv['recv_bytes'] ? parseInt(kv['recv_bytes'], 10) : 0,
    duration_ms: kv['duration'] ? parseInt(kv['duration'], 10) * 1000 : null,
    user_name: kv['user_name'] ?? kv['user'] ?? null,
    url: kv['url'] ?? kv['domain'] ?? null,
    application: kv['application'] ?? kv['app_name'] ?? null,
    threat_name: kv['signature_msg'] ?? kv['virus'] ?? null,
    threat_category: logType === 'IDP' ? 'intrusion' : logType === 'Anti-Virus' ? 'malware' : null,
    severity,
    parsed_data: kv,
  }
}
