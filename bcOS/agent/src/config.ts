import * as fs from 'fs'
import * as path from 'path'
import type { AgentConfig } from './types'

const CONFIG_PATH = process.env.BCOS_CONFIG_PATH ?? '/etc/bcvision/config.json'
const CONFIG_DIR  = path.dirname(CONFIG_PATH)

const DEFAULTS: AgentConfig = {
  bcvision_url:     '',
  bcvision_api_key: '',
  syslog_udp_port:  514,
  syslog_tcp_port:  514,
  web_port:         80,
  agent_name:       'bcOS-Agent',
}

let _config: AgentConfig = { ...DEFAULTS }

export function loadConfig(): AgentConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
      _config = { ...DEFAULTS, ...JSON.parse(raw) }
    }
  } catch (err) {
    console.warn('[bcOS] No se pudo leer config, usando defaults:', (err as Error).message)
  }
  return _config
}

export function saveConfig(partial: Partial<AgentConfig>): void {
  _config = { ..._config, ...partial }
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true })
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(_config, null, 2), 'utf8')
    console.log('[bcOS] Configuración guardada en', CONFIG_PATH)
  } catch (err) {
    console.error('[bcOS] Error guardando config:', (err as Error).message)
    throw err
  }
}

export function getConfig(): AgentConfig {
  return _config
}

export function isConfigured(): boolean {
  return Boolean(_config.bcvision_url && _config.bcvision_api_key)
}
