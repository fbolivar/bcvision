import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'
import type { ParsedFirewallEvent, SyslogMessage } from './types'

const DB_DIR  = process.env.BCOS_DB_PATH ?? '/var/lib/bcvision'
const DB_FILE = path.join(DB_DIR, 'events.db')

let db: Database.Database

export function openDatabase(): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

  db = new Database(DB_FILE)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = -64000')  // 64 MB cache
  db.pragma('temp_store = MEMORY')

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      event_time   TEXT    NOT NULL,
      source_ip    TEXT    NOT NULL,
      brand        TEXT    NOT NULL DEFAULT 'generic',
      event_type   TEXT    NOT NULL,
      action       TEXT,
      severity     TEXT    NOT NULL DEFAULT 'info',
      protocol     TEXT,
      src_ip       TEXT,
      dst_ip       TEXT,
      src_port     INTEGER,
      dst_port     INTEGER,
      bytes_sent   INTEGER DEFAULT 0,
      bytes_recv   INTEGER DEFAULT 0,
      user_name    TEXT,
      application  TEXT,
      threat_name  TEXT,
      threat_cat   TEXT,
      firewall_rule TEXT,
      raw_message  TEXT,
      received_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_time     ON events(event_time DESC);
    CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
    CREATE INDEX IF NOT EXISTS idx_events_src_ip   ON events(src_ip);
    CREATE INDEX IF NOT EXISTS idx_events_type     ON events(event_type);

    CREATE TABLE IF NOT EXISTS hourly_stats (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      hour_bucket  TEXT NOT NULL,
      brand        TEXT NOT NULL DEFAULT 'generic',
      total        INTEGER DEFAULT 0,
      allowed      INTEGER DEFAULT 0,
      blocked      INTEGER DEFAULT 0,
      threats      INTEGER DEFAULT 0,
      bytes_in     INTEGER DEFAULT 0,
      bytes_out    INTEGER DEFAULT 0,
      synced       INTEGER DEFAULT 0,
      UNIQUE(hour_bucket, brand)
    );

    CREATE TABLE IF NOT EXISTS alerts_queue (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id     INTEGER REFERENCES events(id),
      severity     TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      synced       INTEGER DEFAULT 0
    );
  `)

  console.log(`[bcOS] Base de datos: ${DB_FILE}`)
}

// ── Insert event ────────────────────────────────────────────────
const insertEvent = () => db.prepare(`
  INSERT INTO events (
    event_time, source_ip, brand, event_type, action, severity,
    protocol, src_ip, dst_ip, src_port, dst_port,
    bytes_sent, bytes_recv, user_name, application,
    threat_name, threat_cat, firewall_rule, raw_message
  ) VALUES (
    @event_time, @source_ip, @brand, @event_type, @action, @severity,
    @protocol, @src_ip, @dst_ip, @src_port, @dst_port,
    @bytes_sent, @bytes_recv, @user_name, @application,
    @threat_name, @threat_cat, @firewall_rule, @raw_message
  )
`)

export function saveEvent(
  syslogMsg: SyslogMessage,
  event: ParsedFirewallEvent,
  brand: string
): number {
  const stmt = insertEvent()
  const info = stmt.run({
    event_time:    syslogMsg.timestamp.toISOString(),
    source_ip:     syslogMsg.sourceIp,
    brand,
    event_type:    event.event_type,
    action:        event.action,
    severity:      event.severity,
    protocol:      event.protocol,
    src_ip:        event.src_ip,
    dst_ip:        event.dst_ip,
    src_port:      event.src_port,
    dst_port:      event.dst_port,
    bytes_sent:    event.bytes_sent,
    bytes_recv:    event.bytes_received,
    user_name:     event.user_name,
    application:   event.application,
    threat_name:   event.threat_name,
    threat_cat:    event.threat_category,
    firewall_rule: event.firewall_rule ?? null,
    raw_message:   syslogMsg.raw,
  })

  const eventId = info.lastInsertRowid as number

  // Queue alert if critical or high
  if (event.severity === 'critical' || event.severity === 'high') {
    db.prepare(`
      INSERT INTO alerts_queue (event_id, severity) VALUES (?, ?)
    `).run(eventId, event.severity)
  }

  // Update hourly stats
  const hour = syslogMsg.timestamp.toISOString().slice(0, 13) + ':00:00'
  db.prepare(`
    INSERT INTO hourly_stats (hour_bucket, brand, total, allowed, blocked, threats, bytes_in, bytes_out)
    VALUES (@hour, @brand, 1,
      CASE WHEN @action IN ('allow','monitor') THEN 1 ELSE 0 END,
      CASE WHEN @action IN ('deny','drop','reset') THEN 1 ELSE 0 END,
      CASE WHEN @type IN ('threat') THEN 1 ELSE 0 END,
      @bytes_in, @bytes_out)
    ON CONFLICT(hour_bucket, brand) DO UPDATE SET
      total    = total + 1,
      allowed  = allowed  + CASE WHEN @action IN ('allow','monitor') THEN 1 ELSE 0 END,
      blocked  = blocked  + CASE WHEN @action IN ('deny','drop','reset') THEN 1 ELSE 0 END,
      threats  = threats  + CASE WHEN @type IN ('threat') THEN 1 ELSE 0 END,
      bytes_in  = bytes_in  + @bytes_in,
      bytes_out = bytes_out + @bytes_out
  `).run({
    hour,
    brand,
    action:    event.action ?? '',
    type:      event.event_type,
    bytes_in:  event.bytes_received,
    bytes_out: event.bytes_sent,
  })

  return eventId
}

// ── Query helpers ───────────────────────────────────────────────
export function queryEvents(opts: {
  limit?: number
  offset?: number
  severity?: string
  src_ip?: string
  event_type?: string
  since?: string
}) {
  const wheres: string[] = []
  const params: Record<string, unknown> = {}

  if (opts.severity)   { wheres.push('severity = @severity');     params.severity   = opts.severity }
  if (opts.src_ip)     { wheres.push('src_ip = @src_ip');         params.src_ip     = opts.src_ip }
  if (opts.event_type) { wheres.push('event_type = @event_type'); params.event_type = opts.event_type }
  if (opts.since)      { wheres.push('event_time >= @since');     params.since      = opts.since }

  const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
  params.limit  = opts.limit  ?? 100
  params.offset = opts.offset ?? 0

  return db.prepare(`
    SELECT * FROM events ${where}
    ORDER BY event_time DESC
    LIMIT @limit OFFSET @offset
  `).all(params)
}

export function countEvents(opts: { since?: string; severity?: string } = {}) {
  const wheres: string[] = []
  const params: Record<string, unknown> = {}
  if (opts.since)    { wheres.push('event_time >= @since');   params.since    = opts.since }
  if (opts.severity) { wheres.push('severity = @severity');   params.severity = opts.severity }
  const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
  const row = db.prepare(`SELECT COUNT(*) as n FROM events ${where}`).get(params) as { n: number }
  return row.n
}

export function getHourlyStats(hours = 24) {
  const since = new Date(Date.now() - hours * 3600_000).toISOString().slice(0, 13) + ':00:00'
  return db.prepare(`
    SELECT hour_bucket, SUM(total) as total, SUM(allowed) as allowed,
           SUM(blocked) as blocked, SUM(threats) as threats,
           SUM(bytes_in) as bytes_in, SUM(bytes_out) as bytes_out
    FROM hourly_stats
    WHERE hour_bucket >= ?
    GROUP BY hour_bucket
    ORDER BY hour_bucket
  `).all(since)
}

export function getTopSources(limit = 10, hours = 24) {
  const since = new Date(Date.now() - hours * 3600_000).toISOString()
  return db.prepare(`
    SELECT src_ip, COUNT(*) as count,
           SUM(CASE WHEN action IN ('deny','drop','reset') THEN 1 ELSE 0 END) as blocked
    FROM events
    WHERE event_time >= ? AND src_ip IS NOT NULL
    GROUP BY src_ip ORDER BY count DESC LIMIT ?
  `).all(since, limit)
}

export function getPendingAlerts() {
  return db.prepare(`
    SELECT aq.id as queue_id, e.*
    FROM alerts_queue aq
    JOIN events e ON e.id = aq.event_id
    WHERE aq.synced = 0
    ORDER BY aq.created_at
    LIMIT 50
  `).all()
}

export function markAlertsSynced(queueIds: number[]) {
  if (!queueIds.length) return
  const placeholders = queueIds.map(() => '?').join(',')
  db.prepare(`UPDATE alerts_queue SET synced = 1 WHERE id IN (${placeholders})`).run(...queueIds)
}

export function getPendingStats() {
  return db.prepare(`
    SELECT * FROM hourly_stats
    WHERE synced = 0
    ORDER BY hour_bucket
    LIMIT 100
  `).all()
}

export function markStatsSynced(ids: number[]) {
  if (!ids.length) return
  const placeholders = ids.map(() => '?').join(',')
  db.prepare(`UPDATE hourly_stats SET synced = 1 WHERE id IN (${placeholders})`).run(...ids)
}

// ── Retention cleanup ───────────────────────────────────────────
export function cleanOldEvents(retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 86400_000).toISOString()
  const result = db.prepare(`DELETE FROM events WHERE event_time < ?`).run(cutoff)
  db.prepare(`DELETE FROM hourly_stats WHERE hour_bucket < ?`).run(cutoff.slice(0, 13) + ':00:00')
  console.log(`[bcOS] Limpieza: ${result.changes} eventos eliminados (retención ${retentionDays}d)`)
}

export function getDatabaseSize(): string {
  try {
    const stat = fs.statSync(DB_FILE)
    const mb = (stat.size / 1024 / 1024).toFixed(1)
    return `${mb} MB`
  } catch { return '—' }
}
