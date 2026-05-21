import * as dgram from 'dgram'
import * as net from 'net'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv') as { config: () => void }
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseSyslogMessage } from './syslog-parser'
import { getParser } from './parsers'
import type { DeviceRecord } from './types'

dotenv.config()


const UDP_PORT = parseInt(process.env.SYSLOG_UDP_PORT ?? '514', 10)
const TCP_PORT = parseInt(process.env.SYSLOG_TCP_PORT ?? '514', 10)
const SUPABASE_URL = process.env.SYSLOG_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SYSLOG_SUPABASE_SERVICE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[FirewallIQ] ERROR: Faltan variables SYSLOG_SUPABASE_URL o SYSLOG_SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Cache de dispositivos: ip → DeviceRecord
const deviceCache = new Map<string, DeviceRecord | null>()
const CACHE_TTL_MS = 5 * 60 * 1_000

async function lookupDevice(ip: string): Promise<DeviceRecord | null> {
  if (deviceCache.has(ip)) return deviceCache.get(ip) ?? null

  const { data } = await supabase
    .from('devices')
    .select('id, org_id, brand')
    .eq('ip_address', ip)
    .eq('active', true)
    .single()

  const device = data as DeviceRecord | null
  deviceCache.set(ip, device)
  setTimeout(() => deviceCache.delete(ip), CACHE_TTL_MS)
  return device
}

async function processMessage(raw: string, sourceIp: string) {
  const syslogMsg = parseSyslogMessage(raw.trim(), sourceIp)
  if (!syslogMsg) return

  const device = await lookupDevice(sourceIp)
  if (!device) {
    // Dispositivo desconocido — guardar raw igualmente con org_id null
    // En producción, se puede rechazar o encolar para revisión
    console.warn(`[FirewallIQ] Mensaje de dispositivo no registrado: ${sourceIp}`)
    return
  }

  // 1. Guardar mensaje raw
  const { data: rawRecord, error: rawError } = await supabase
    .from('syslog_raw')
    .insert({
      org_id: device.org_id,
      device_id: device.id,
      raw_message: syslogMsg.raw,
      source_ip: sourceIp,
      facility: syslogMsg.facility,
      severity: syslogMsg.severity,
      received_at: syslogMsg.timestamp.toISOString(),
    })
    .select('id')
    .single()

  if (rawError) {
    console.error('[FirewallIQ] Error guardando syslog_raw:', rawError.message)
    return
  }

  // 2. Parsear según fabricante
  const parser = getParser(device.brand)
  const event = parser(syslogMsg)

  // 3. Derivar regla de firewall desde los campos del evento
  function deriveRule(e: typeof event): string {
    const action = (e.action ?? 'ALLOW').toUpperCase()
    const sanitize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (e.threat_category && ['deny','drop','block','reset'].includes(e.action ?? ''))
      return `${action}-${sanitize(e.threat_category)}`
    if (e.application) return `${action}-${sanitize(e.application)}`
    if (e.url)         return `${action}-WEB-CONTENT`
    if (e.dst_port && e.protocol) return `${action}-${sanitize(e.protocol)}-P${e.dst_port}`
    return `${action}-${sanitize(e.protocol ?? 'ANY')}`
  }

  // 4. Guardar evento parseado
  const { error: evtError } = await supabase
    .from('firewall_events')
    .insert({
      org_id: device.org_id,
      device_id: device.id,
      raw_id: rawRecord?.id ?? null,
      event_time: syslogMsg.timestamp.toISOString(),
      firewall_rule: deriveRule(event),
      ...event,
    })

  if (evtError) {
    console.error('[FirewallIQ] Error guardando firewall_events:', evtError.message)
    return
  }

  // 4. Actualizar last_seen del dispositivo
  await supabase
    .from('devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', device.id)

  console.log(`[FirewallIQ] ✓ ${device.brand} | ${sourceIp} | ${event.event_type} | ${event.severity}`)
}

// ── UDP Server ───────────────────────────────────────────────
function startUdpServer() {
  const server = dgram.createSocket('udp4')

  server.on('message', (msg, rinfo) => {
    processMessage(msg.toString(), rinfo.address).catch(err =>
      console.error('[FirewallIQ] UDP processing error:', err)
    )
  })

  server.on('error', err => {
    console.error('[FirewallIQ] UDP error:', err.message)
  })

  server.bind(UDP_PORT, () => {
    console.log(`[FirewallIQ] UDP Syslog escuchando en puerto ${UDP_PORT}`)
  })

  return server
}

// ── TCP Server ───────────────────────────────────────────────
function startTcpServer() {
  const server = net.createServer(socket => {
    const remoteIp = socket.remoteAddress?.replace('::ffff:', '') ?? 'unknown'
    let buffer = ''

    socket.on('data', chunk => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.trim()) {
          processMessage(line, remoteIp).catch(err =>
            console.error('[FirewallIQ] TCP processing error:', err)
          )
        }
      }
    })

    socket.on('error', err => {
      console.error(`[FirewallIQ] TCP socket error (${remoteIp}):`, err.message)
    })
  })

  server.listen(TCP_PORT, () => {
    console.log(`[FirewallIQ] TCP Syslog escuchando en puerto ${TCP_PORT}`)
  })

  return server
}

// ── Main ─────────────────────────────────────────────────────
console.log('[FirewallIQ] Iniciando Syslog Listener...')
startUdpServer()
startTcpServer()

process.on('SIGTERM', () => {
  console.log('[FirewallIQ] Shutting down...')
  process.exit(0)
})
