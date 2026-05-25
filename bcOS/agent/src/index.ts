import * as dgram from 'dgram'
import * as net   from 'net'
import * as fs    from 'fs'
import * as path  from 'path'

import { loadConfig, getConfig, isConfigured } from './config'
import { parseSyslogMessage }                  from './syslog-parser'
import { getParser }                           from './parsers/index'
import { openDatabase, saveEvent, cleanOldEvents, getDatabaseSize } from './storage'
import { startSyncLoop }                       from './aggregator'
import { startWebServer }                      from './web'
import { forwardEvent }                        from './forwarder'
import { startFortigatePoller }                from './fortigate-api'
import type { FirewallBrand }                  from './types'

// ── Init ──────────────────────────────────────────────────────────
loadConfig()
openDatabase()

const cfg = getConfig()

// ── Brand map: source IP → firewall brand ─────────────────────────
const BRAND_MAP_PATH = process.env.BCOS_BRAND_MAP_PATH ?? '/etc/bcvision/brand-map.json'
let brandMap: Record<string, FirewallBrand> = {}
try {
  if (fs.existsSync(BRAND_MAP_PATH))
    brandMap = JSON.parse(fs.readFileSync(BRAND_MAP_PATH, 'utf8')) as Record<string, FirewallBrand>
} catch { /* fallback to generic */ }

function getBrand(ip: string): FirewallBrand {
  return brandMap[ip] ?? 'generic'
}

// ── Rule derivation ───────────────────────────────────────────────
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

// ── Stats counter ─────────────────────────────────────────────────
let msgReceived = 0
let msgSaved    = 0
let lastMsgAt: Date | null = null

export function getAgentStats() {
  return { msgReceived, msgSaved, lastMsgAt, dbSize: getDatabaseSize() }
}

// ── Message processor ─────────────────────────────────────────────
async function processMessage(raw: string, sourceIp: string) {
  msgReceived++
  lastMsgAt = new Date()

  const syslogMsg = parseSyslogMessage(raw.trim(), sourceIp)
  if (!syslogMsg) return

  const brand  = getBrand(sourceIp)
  const parser = getParser(brand)
  const event  = parser(syslogMsg)
  event.firewall_rule = deriveRule(event)

  try {
    saveEvent(syslogMsg, event, brand)
    msgSaved++
    const pd = event.parsed_data as Record<string, unknown> | undefined
    const catdesc = pd?.['catdesc'] as string | undefined
    const isWebfilterCat = pd?.['subtype'] === 'webfilter'
      && catdesc && catdesc !== 'Unrated' && catdesc !== 'Unknown'
    if (event.severity === 'critical' || event.severity === 'high' || isWebfilterCat) {
      if (event.severity === 'critical' || event.severity === 'high')
        console.log(`[bcOS] 🚨 ${brand} | ${sourceIp} | ${event.event_type} | ${event.severity}`)
      const cfg = getConfig()
      if (cfg.bcvision_url && cfg.bcvision_api_key) {
        forwardEvent(cfg, syslogMsg, event).catch(err =>
          console.error(`[bcOS] Error reenviando a BCVision: ${(err as Error).message}`)
        )
      }
    }
  } catch (err) {
    console.error(`[bcOS] Error guardando evento: ${(err as Error).message}`)
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
  server.on('error', err => console.error('[bcOS] UDP server error:', err.message))
  server.bind(port, () => console.log(`[bcOS] UDP Syslog :${port}`))
  return server
}

// ── TCP Server ────────────────────────────────────────────────────
function startTcpServer(port: number) {
  const server = net.createServer(socket => {
    const ip = socket.remoteAddress?.replace('::ffff:', '') ?? 'unknown'
    let buf = ''
    socket.on('data', chunk => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (line.trim())
          processMessage(line, ip).catch(err => console.error('[bcOS] TCP error:', err))
      }
    })
    socket.on('error', err => console.error(`[bcOS] TCP socket (${ip}):`, err.message))
  })
  server.listen(port, () => console.log(`[bcOS] TCP Syslog :${port}`))
  return server
}

// ── Daily cleanup (retention) ─────────────────────────────────────
function scheduleCleanup() {
  const RETENTION_DAYS = parseInt(process.env.BCOS_RETENTION_DAYS ?? '365', 10)
  // Run once at startup, then every 24h
  cleanOldEvents(RETENTION_DAYS)
  setInterval(() => cleanOldEvents(RETENTION_DAYS), 24 * 60 * 60_000)
}

// ── Main ──────────────────────────────────────────────────────────
console.log('[bcOS] Iniciando agente (almacenamiento local SQLite)...')

startUdpServer(cfg.syslog_udp_port)
startTcpServer(cfg.syslog_tcp_port)
startWebServer(cfg.web_port)
scheduleCleanup()

// Only sync to BCVision if configured
if (isConfigured()) {
  startSyncLoop(cfg)
  console.log(`[bcOS] Sincronización con BCVision: ${cfg.bcvision_url}`)
  if (cfg.fortigate_ip && cfg.fortigate_api_token) {
    startFortigatePoller(cfg)
    console.log(`[bcOS] FortiGate API poller activo: ${cfg.fortigate_ip}`)
  }
} else {
  console.log('[bcOS] Sin configuración BCVision — modo standalone (solo almacenamiento local)')
}

process.on('SIGTERM', () => { console.log('[bcOS] Shutting down...'); process.exit(0) })
process.on('SIGINT',  () => { console.log('[bcOS] Shutting down...'); process.exit(0) })

// Evitar que errores de red/stream no capturados derriben el proceso
process.on('uncaughtException',   err => console.error('[bcOS] uncaughtException:', err.message))
process.on('unhandledRejection',  err => console.error('[bcOS] unhandledRejection:', err))
