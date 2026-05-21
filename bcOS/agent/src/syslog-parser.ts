import type { SyslogMessage } from './types'

const RFC3164 = /^<(\d+)>(\w{3}\s+\d+\s+[\d:]+)\s+(\S+)\s+(.*)/
const RFC5424 = /^<(\d+)>1\s+(\S+)\s+(\S+)\s+(\S+)\s+\S+\s+\S+\s+(?:-|\[.*?\])\s*(.*)/

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseRfc3164Timestamp(ts: string): Date {
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
  const m5424 = RFC5424.exec(raw)
  if (m5424) {
    const pri = parseInt(m5424[1], 10)
    return {
      facility:  Math.floor(pri / 8),
      severity:  pri % 8,
      timestamp: new Date(m5424[2]),
      hostname:  m5424[3] === '-' ? sourceIp : m5424[3],
      appName:   m5424[4] === '-' ? '' : m5424[4],
      message:   m5424[5] ?? '',
      raw,
      sourceIp,
    }
  }

  const m3164 = RFC3164.exec(raw)
  if (m3164) {
    const pri = parseInt(m3164[1], 10)
    return {
      facility:  Math.floor(pri / 8),
      severity:  pri % 8,
      timestamp: parseRfc3164Timestamp(m3164[2]),
      hostname:  m3164[3],
      appName:   '',
      message:   m3164[4] ?? '',
      raw,
      sourceIp,
    }
  }

  return {
    facility:  1,
    severity:  6,
    timestamp: new Date(),
    hostname:  sourceIp,
    appName:   '',
    message:   raw,
    raw,
    sourceIp,
  }
}
