import type { AgentConfig, AgentStats, ParsedFirewallEvent, SyslogMessage } from './types'

export interface ForwardPayload {
  source_ip:      string
  raw_message:    string
  facility:       number
  severity:       number
  received_at:    string
  event:          ParsedFirewallEvent
  agent_name:     string
}

let stats: AgentStats = {
  startedAt:          new Date(),
  messagesReceived:   0,
  messagesForwarded:  0,
  messagesFailed:     0,
  lastMessage:        null,
  connected:          false,
  lastError:          null,
}

export function getStats(): AgentStats { return { ...stats } }

export function incrementReceived() {
  stats.messagesReceived++
  stats.lastMessage = new Date()
}

export async function forwardEvent(
  cfg: AgentConfig,
  syslogMsg: SyslogMessage,
  event: ParsedFirewallEvent
): Promise<void> {
  const payload: ForwardPayload = {
    source_ip:    syslogMsg.sourceIp,
    raw_message:  syslogMsg.raw,
    facility:     syslogMsg.facility,
    severity:     syslogMsg.severity,
    received_at:  syslogMsg.timestamp.toISOString(),
    event,
    agent_name:   cfg.agent_name,
  }

  try {
    const res = await fetch(`${cfg.bcvision_url}/api/agent/ingest`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${cfg.bcvision_api_key}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${body}`)
    }

    stats.messagesForwarded++
    stats.connected  = true
    stats.lastError  = null
  } catch (err) {
    stats.messagesFailed++
    stats.connected  = false
    stats.lastError  = (err as Error).message
    throw err
  }
}
