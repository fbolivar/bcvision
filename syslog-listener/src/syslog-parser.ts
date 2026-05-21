import type { SyslogMessage } from './types'

// RFC 3164: <PRI>TIMESTAMP HOSTNAME MESSAGE
const RFC3164 = /^<(\d+)>(\w{3}\s+\d+\s+[\d:]+)\s+(\S+)\s+(.*)/

// RFC 5424: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
const RFC5424 = /^<(\d+)>1\s+(\S+)\s+(\S+)\s+(\S+)\s+\S+\s+\S+\s+(?:-|\[.*?\])\s*(.*)/

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseRfc3164Timestamp(ts: string): Date {
  // "Jan  5 12:30:00"
  const parts = ts.trim().split(/\s+/)
  const month = MONTHS[parts[0]] ?? 0
  const day = parseInt(parts[1], 10)
  const timeParts = (parts[2] ?? '00:00:00').split(':')
  const now = new Date()
  return new Date(
    now.getFullYear(), month, day,
    parseInt(timeParts[0], 10),
    parseInt(timeParts[1], 10),
    parseInt(timeParts[2] ?? '0', 10)
  )
}

export function parseSyslogMessage(raw: string, sourceIp: string): SyslogMessage | null {
  const rfcMatch5424 = RFC5424.exec(raw)
  if (rfcMatch5424) {
    const pri = parseInt(rfcMatch5424[1], 10)
    return {
      facility: Math.floor(pri / 8),
      severity: pri % 8,
      timestamp: new Date(rfcMatch5424[2]),
      hostname: rfcMatch5424[3] === '-' ? sourceIp : rfcMatch5424[3],
      appName: rfcMatch5424[4] === '-' ? '' : rfcMatch5424[4],
      message: rfcMatch5424[5] ?? '',
      raw,
      sourceIp,
    }
  }

  const rfcMatch3164 = RFC3164.exec(raw)
  if (rfcMatch3164) {
    const pri = parseInt(rfcMatch3164[1], 10)
    return {
      facility: Math.floor(pri / 8),
      severity: pri % 8,
      timestamp: parseRfc3164Timestamp(rfcMatch3164[2]),
      hostname: rfcMatch3164[3],
      appName: '',
      message: rfcMatch3164[4] ?? '',
      raw,
      sourceIp,
    }
  }

  // Fallback: mensaje sin cabecera estándar
  return {
    facility: 1,
    severity: 6,
    timestamp: new Date(),
    hostname: sourceIp,
    appName: '',
    message: raw,
    raw,
    sourceIp,
  }
}
