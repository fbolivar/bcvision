import * as dgram from 'dgram'
import * as net   from 'net'
import * as path  from 'path'
import * as fs    from 'fs'

import { loadConfig, getConfig, isConfigured } from './config'
import { parseSyslogMessage }                  from './syslog-parser'
import { getParser }                           from './parsers/index'
import { forwardEvent, incrementReceived }     from './forwarder'
import { startWebServer }                      from './web'
import type { FirewallBrand }                  from './types'

// Load config on boot
loadConfig()

const cfg = getConfig()

// ── Detect firewall brand from source IP using config map ──────────
const BRAND_MAP_PATH = process.env.BCOS_BRAND_MAP_PATH ?? '/etc/bcvision/brand-map.json'
let brandMap: Record<string, FirewallBrand> = {}
try {
  if (fs.existsSync(BRAND_MAP_PATH)) {
    brandMap = JSON.parse(fs.readFileSync(BRAND_MAP_PATH, 'utf8')) as Record<string, FirewallBrand>
  }
} catch { /* fallback to generic */ }

function getBrand(ip: string): FirewallBrand {
  return brandMap[ip] ?? 'generic'
}

// ── Firewall rule derivation ───────────────────────────────────────
function deriveRule(e: ReturnType<ReturnType<typeof getParser>>): string {
  const action   = (e.action ?? 'ALLOW').toUpperCase()
  const sanitize = (s: string) =>
    s.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  if (e.threat_category && ['deny','drop','block','reset'].includes(e.action ?? ''))
    return `${action}-${sanitize(e.threat_category)}`
  if (e.application) return `${action}-${sanitize(e.application)}`
  if (e.url)         return `${action}-WEB-CONTENT`
  if (e.dst_port && e.protocol) return `${action}-${sanitize(e.protocol)}-P${e.dst_port}`
  return `${action}-${sanitize(e.protocol ?? 'ANY')}`
}

// ── Message processor ─────────────────────────────────────────────
async function processMessage(raw: string, sourceIp: string) {
  incrementReceived()

  const syslogMsg = parseSyslogMessage(raw.trim(), sourceIp)
  if (!syslogMsg) return

  const brand  = getBrand(sourceIp)
  const parser = getParser(brand)
  const event  = parser(syslogMsg)
  event.firewall_rule = deriveRule(event)

  if (!isConfigured()) {
    console.warn('[bcOS] Sin configuración — descartando mensaje de', sourceIp)
    return
  }

  try {
    await forwardEvent(getConfig(), syslogMsg, event)
    console.log(`[bcOS] ✓ ${brand} | ${sourceIp} | ${event.event_type} | ${event.severity}`)
  } catch (err) {
    console.error(`[bcOS] Error enviando evento: ${(err as Error).message}`)
  }
}

// ── UDP Server ────────────────────────────────────────────────────
function startUdpServer(port: number) {
  const server = dgram.createSocket('udp4')

  server.on('message', (msg, rinfo) => {
    processMessage(msg.toString(), rinfo.address).catch(err =>
      console.error('[bcOS] UDP error:', err)
    )
  })

  server.on('error', err => {
    console.error('[bcOS] UDP server error:', err.message)
  })

  server.bind(port, () => {
    console.log(`[bcOS] UDP Syslog escuchando en :${port}`)
  })

  return server
}

// ── TCP Server ────────────────────────────────────────────────────
function startTcpServer(port: number) {
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
            console.error('[bcOS] TCP error:', err)
          )
        }
      }
    })

    socket.on('error', err => {
      console.error(`[bcOS] TCP socket error (${remoteIp}):`, err.message)
    })
  })

  server.listen(port, () => {
    console.log(`[bcOS] TCP Syslog escuchando en :${port}`)
  })

  return server
}

// ── Main ──────────────────────────────────────────────────────────
console.log('[bcOS] Iniciando agente...')

const UDP_PORT = cfg.syslog_udp_port
const TCP_PORT = cfg.syslog_tcp_port
const WEB_PORT = cfg.web_port

startUdpServer(UDP_PORT)
startTcpServer(TCP_PORT)
startWebServer(WEB_PORT)

process.on('SIGTERM', () => {
  console.log('[bcOS] Shutting down...')
  process.exit(0)
})
