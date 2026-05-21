import type { ParsedFirewallEvent, SyslogMessage, EventType, EventAction, Severity } from '../types'

/**
 * Palo Alto Networks — formato CSV con campos fijos según tipo de log
 * TRAFFIC: ...src,dst,natSrc,natDst,rule,srcUser,app,vsys,srcZone,dstZone,inIf,outIf,logFwdProfile,
 *           sessionId,repeatCnt,srcPort,dstPort,natSrcPort,natDstPort,flags,protocol,action,
 *           bytes,bytesSent,bytesReceived,packets,startTime,elapsedTime...
 * THREAT:  similar + subtype, threatId, threatName, severity, direction
 */

export function parsePaloAlto(msg: SyslogMessage): ParsedFirewallEvent {
  const parts = msg.message.split(',')

  // PAN-OS CSV — el tipo está en la posición 3 (0-indexed)
  const logType = parts[3]?.trim().toUpperCase() ?? ''

  if (logType === 'TRAFFIC') {
    const action = (parts[30] ?? '').toLowerCase() as EventAction
    const protocol = parts[29] ?? null
    return {
      event_type: action === 'deny' || action === 'drop' ? 'block' : 'traffic',
      action: (['allow','deny','drop','reset','monitor','redirect'].includes(action) ? action : null) as EventAction | null,
      protocol: protocol?.toUpperCase() ?? null,
      src_ip: parts[7] ?? null,
      dst_ip: parts[8] ?? null,
      src_port: parts[24] ? parseInt(parts[24], 10) : null,
      dst_port: parts[25] ? parseInt(parts[25], 10) : null,
      src_country: null,
      dst_country: null,
      bytes_sent: parts[32] ? parseInt(parts[32], 10) : 0,
      bytes_received: parts[33] ? parseInt(parts[33], 10) : 0,
      duration_ms: parts[35] ? parseInt(parts[35], 10) * 1000 : null,
      user_name: parts[13] ?? null,
      url: null,
      application: parts[14] ?? null,
      threat_name: null,
      threat_category: null,
      severity: action === 'deny' || action === 'drop' ? 'low' : 'info',
      parsed_data: { parts, raw: msg.message },
    }
  }

  if (logType === 'THREAT') {
    const threatSeverity = (parts[50] ?? '').toLowerCase()
    const severityMap: Record<string, Severity> = {
      critical: 'critical', high: 'high',
      medium: 'medium', low: 'low', informational: 'info',
    }
    return {
      event_type: 'threat',
      action: 'drop',
      protocol: parts[29]?.toUpperCase() ?? null,
      src_ip: parts[7] ?? null,
      dst_ip: parts[8] ?? null,
      src_port: parts[24] ? parseInt(parts[24], 10) : null,
      dst_port: parts[25] ? parseInt(parts[25], 10) : null,
      src_country: null,
      dst_country: null,
      bytes_sent: 0,
      bytes_received: 0,
      duration_ms: null,
      user_name: parts[13] ?? null,
      url: parts[48] ?? null,
      application: parts[14] ?? null,
      threat_name: parts[38] ?? null,
      threat_category: parts[37] ?? null,
      severity: severityMap[threatSeverity] ?? 'high',
      parsed_data: { parts, raw: msg.message },
    }
  }

  // URL filtering, auth, system — fallback
  return {
    event_type: 'system',
    action: null,
    protocol: null,
    src_ip: parts[7] ?? null, dst_ip: parts[8] ?? null,
    src_port: null, dst_port: null, src_country: null, dst_country: null,
    bytes_sent: 0, bytes_received: 0, duration_ms: null,
    user_name: null, url: null, application: null,
    threat_name: null, threat_category: null,
    severity: 'info',
    parsed_data: { logType, parts, raw: msg.message },
  }
}
