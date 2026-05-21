import * as http    from 'http'
import * as fs      from 'fs'
import * as path    from 'path'
import { getConfig, saveConfig, isConfigured } from './config'
import { getStats }                            from './forwarder'

const UI_DIR = path.join(__dirname, '..', 'ui')

function serveFile(res: http.ServerResponse, filePath: string, contentType: string) {
  try {
    const data = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type':                'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(body)
}

export function startWebServer(port: number) {
  const server = http.createServer(async (req, res) => {
    const url    = req.url ?? '/'
    const method = req.method ?? 'GET'

    // ── API ──────────────────────────────────────────────────────
    if (url === '/api/status' && method === 'GET') {
      const cfg   = getConfig()
      const stats = getStats()
      return json(res, 200, {
        configured:  isConfigured(),
        agent_name:  cfg.agent_name,
        bcvision_url: cfg.bcvision_url,
        stats: {
          started_at:          stats.startedAt.toISOString(),
          messages_received:   stats.messagesReceived,
          messages_forwarded:  stats.messagesForwarded,
          messages_failed:     stats.messagesFailed,
          last_message:        stats.lastMessage?.toISOString() ?? null,
          connected:           stats.connected,
          last_error:          stats.lastError,
        },
      })
    }

    if (url === '/api/config' && method === 'GET') {
      const cfg = getConfig()
      // Never return the API key — mask it
      return json(res, 200, {
        bcvision_url:     cfg.bcvision_url,
        bcvision_api_key: cfg.bcvision_api_key ? '***' : '',
        syslog_udp_port:  cfg.syslog_udp_port,
        syslog_tcp_port:  cfg.syslog_tcp_port,
        web_port:         cfg.web_port,
        agent_name:       cfg.agent_name,
      })
    }

    if (url === '/api/config' && method === 'POST') {
      try {
        const body = await readBody(req)
        const data = JSON.parse(body) as Record<string, unknown>

        const updates: Record<string, unknown> = {}
        if (typeof data.bcvision_url === 'string' && data.bcvision_url)
          updates.bcvision_url = data.bcvision_url.replace(/\/$/, '')
        if (typeof data.bcvision_api_key === 'string' && data.bcvision_api_key !== '***')
          updates.bcvision_api_key = data.bcvision_api_key
        if (typeof data.agent_name === 'string' && data.agent_name)
          updates.agent_name = data.agent_name
        if (typeof data.syslog_udp_port === 'number')
          updates.syslog_udp_port = data.syslog_udp_port
        if (typeof data.syslog_tcp_port === 'number')
          updates.syslog_tcp_port = data.syslog_tcp_port

        saveConfig(updates)
        return json(res, 200, { ok: true })
      } catch (err) {
        return json(res, 400, { error: (err as Error).message })
      }
    }

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

    // ── Static UI ────────────────────────────────────────────────
    if (url === '/' || url === '/index.html') {
      const page = isConfigured() ? 'dashboard.html' : 'setup.html'
      return serveFile(res, path.join(UI_DIR, page), 'text/html; charset=utf-8')
    }

    if (url === '/setup' || url === '/setup.html') {
      return serveFile(res, path.join(UI_DIR, 'setup.html'), 'text/html; charset=utf-8')
    }

    if (url === '/dashboard' || url === '/dashboard.html') {
      return serveFile(res, path.join(UI_DIR, 'dashboard.html'), 'text/html; charset=utf-8')
    }

    if (url.startsWith('/assets/')) {
      const ext = path.extname(url)
      const ctMap: Record<string, string> = {
        '.css': 'text/css',
        '.js':  'application/javascript',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
      }
      const ct = ctMap[ext] ?? 'application/octet-stream'
      return serveFile(res, path.join(UI_DIR, url), ct)
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  })

  server.listen(port, '0.0.0.0', () => {
    console.log(`[bcOS] Web UI en http://0.0.0.0:${port}`)
  })

  return server
}
