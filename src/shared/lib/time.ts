export function resolveHours(
  raw: string | undefined,
  defaultHours = 0
): { hours: number; isLive: boolean; param: string; label: string } {
  const param  = raw ?? String(defaultHours)
  const isLive = param === '0'
  const hours  = isLive ? 0.25 : (parseFloat(param) || defaultHours)
  const LABELS: Record<string, string> = {
    '0':   'en vivo · últimos 15 min',
    '1':   'última hora',
    '24':  'últimas 24h',
    '168': 'últimos 7 días',
    '720': 'últimos 30 días',
  }
  return { hours, isLive, param, label: LABELS[param] ?? `últimas ${hours}h` }
}
