import * as http from 'http'
import * as fs   from 'fs'
import * as path from 'path'

import { getConfig, saveConfig, isConfigured } from './config'
import { getAgentStats }                        from './index'
import { getStats as getForwarderStats }        from './forwarder'
import {
  queryEvents, countEvents,
  getHourlyStats, getTopSources,
  getDatabaseSize,
} from './storage'

const UI_DIR = path.join(__dirname, '..', 'ui')

function serveFile(res: http.ServerResponse, filePath: string, ct: string) {
  try {
    const data = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': ct })
    res.end(data)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', c => { body += c.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type':                'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(data))
}

export function startWebServer(port: number) {
  const server = http.createServer(async (req, res) => {
    const url    = req.url?.split('?')[0] ?? '/'
    const query  = Object.fromEntries(new URLSearchParams(req.url?.split('?')[1] ?? '').entries())
    const method = req.method ?? 'GET'

    // ── Status ─────────────────────────────────────────────────
    if (url === '/api/status' && method === 'GET') {
      const cfg = getConfig()
      const fwd = getForwarderStats()
      return json(res, 200, {
        configured:   isConfigured(),
        agent_name:   cfg.agent_name,
        bcvision_url: cfg.bcvision_url,
        db_size:      getDatabaseSize(),
        stats: {
          messages_received:  fwd.messagesReceived,
          messages_forwarded: fwd.messagesForwarded,
          messages_failed:    fwd.messagesFailed,
          last_message:       fwd.lastMessage?.toISOString() ?? null,
          connected:          fwd.connected,
          last_error:         fwd.lastError,
          started_at:         fwd.startedAt.toISOString(),
        },
      })
    }

    // ── Config GET ──────────────────────────────────────────────
    if (url === '/api/config' && method === 'GET') {
      const cfg = getConfig()
      return json(res, 200, {
        bcvision_url:     cfg.bcvision_url,
        bcvision_api_key: cfg.bcvision_api_key ? '***' : '',
        syslog_udp_port:  cfg.syslog_udp_port,
        syslog_tcp_port:  cfg.syslog_tcp_port,
        web_port:         cfg.web_port,
        agent_name:       cfg.agent_name,
      })
    }

    // ── Config POST ─────────────────────────────────────────────
    if (url === '/api/config' && method === 'POST') {
      try {
        const data = JSON.parse(await readBody(req)) as Record<string, unknown>
        const updates: Record<string, unknown> = {}
        if (typeof data.bcvision_url === 'string' && data.bcvision_url)
          updates.bcvision_url = data.bcvision_url.replace(/\/$/, '')
        if (typeof data.bcvision_api_key === 'string' && data.bcvision_api_key !== '***')
          updates.bcvision_api_key = data.bcvision_api_key
        if (typeof data.agent_name === 'string' && data.agent_name)
          updates.agent_name = data.agent_name
        if (typeof data.syslog_udp_port === 'number') updates.syslog_udp_port = data.syslog_udp_port
        if (typeof data.syslog_tcp_port === 'number') updates.syslog_tcp_port = data.syslog_tcp_port
        saveConfig(updates)
        return json(res, 200, { ok: true })
      } catch (err) {
        return json(res, 400, { error: (err as Error).message })
      }
    }

    // ── Test BCVision connection ────────────────────────────────
    if (url === '/api/test' && method === 'POST') {
      const cfg = getConfig()
      if (!isConfigured()) return json(res, 400, { error: 'No configurado' })
      try {
        const r = await fetch(`${cfg.bcvision_url}/api/agent/ping`, {
          headers: { 'Authorization': `Bearer ${cfg.bcvision_api_key}` },
          signal: AbortSignal.timeout(5_000),
        })
        if (r.ok) return json(res, 200, { ok: true })
        return json(res, 400, { error: `HTTP ${r.status}` })
      } catch (err) {
        return json(res, 400, { error: (err as Error).message })
      }
    }

    // ── Events query ────────────────────────────────────────────
    if (url === '/api/events' && method === 'GET') {
      const events = queryEvents({
        limit:      parseInt(query.limit ?? '100', 10),
        offset:     parseInt(query.offset ?? '0', 10),
        severity:   query.severity,
        src_ip:     query.src_ip,
        event_type: query.event_type,
        since:      query.since,
      })
      const total = countEvents({ since: query.since, severity: query.severity })
      return json(res, 200, { events, total })
    }

    // ── Stats ───────────────────────────────────────────────────
    if (url === '/api/stats' && method === 'GET') {
      const hours  = parseInt(query.hours ?? '24', 10)
      const hourly = getHourlyStats(hours)
      const top    = getTopSources(10, hours)
      const counts = {
        total:    countEvents({ since: new Date(Date.now() - hours * 3600_000).toISOString() }),
        critical: countEvents({ severity: 'critical', since: new Date(Date.now() - hours * 3600_000).toISOString() }),
        high:     countEvents({ severity: 'high',     since: new Date(Date.now() - hours * 3600_000).toISOString() }),
      }
      return json(res, 200, { hourly, top_sources: top, counts, db_size: getDatabaseSize() })
    }

    // ── Static UI ───────────────────────────────────────────────
    if (url === '/' || url === '/index.html') {
      const page = isConfigured() ? 'dashboard.html' : 'setup.html'
      return serveFile(res, path.join(UI_DIR, page), 'text/html; charset=utf-8')
    }
    if (url === '/setup')     return serveFile(res, path.join(UI_DIR, 'setup.html'),     'text/html; charset=utf-8')
    if (url === '/dashboard') return serveFile(res, path.join(UI_DIR, 'dashboard.html'), 'text/html; charset=utf-8')

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  })

  server.listen(port, '0.0.0.0', () => {
    console.log(`[bcOS] Web UI en http://0.0.0.0:${port}`)
  })

  return server
}
