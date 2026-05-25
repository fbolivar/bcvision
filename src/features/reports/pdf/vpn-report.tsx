import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportMetrics } from '../services/metrics-aggregator'

const DARK    = '#0f172a'
const GRAY    = '#64748b'
const LGRAY   = '#94a3b8'
const LIGHT   = '#f1f5f9'
const LIGHT2  = '#e2e8f0'
const WHITE   = '#ffffff'
const BLUE    = '#1d4ed8'
const RED     = '#dc2626'
const ORANGE  = '#ea580c'
const YELLOW  = '#ca8a04'
const GREEN   = '#16a34a'

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 9, color: DARK, backgroundColor: WHITE },
  inner:        { paddingTop: 36, paddingBottom: 60, paddingHorizontal: 44 },

  // Cover
  coverBand:    { height: 185, backgroundColor: BLUE, position: 'relative', paddingHorizontal: 48, paddingTop: 34, paddingBottom: 22 },
  deco1:        { position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  deco2:        { position: 'absolute', bottom: -15, right: 70, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.04)' },
  accentBar:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(255,255,255,0.30)' },
  coverTitle:   { fontSize: 21, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4 },
  coverSub:     { fontSize: 8.5, color: 'rgba(255,255,255,0.75)', marginBottom: 18 },
  coverBadge:   { borderRadius: 3, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.12)' },
  coverBadgeTxt:{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 1.5 },
  coverBody:    { paddingHorizontal: 48, paddingTop: 22 },
  orgName:      { fontSize: 17, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 },
  periodLine:   { fontSize: 8.5, color: GRAY, marginBottom: 16 },

  // Alert box
  alertBox:     { flexDirection: 'row', backgroundColor: '#fef2f2', borderRadius: 5, padding: 10, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: RED },
  alertTitle:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: RED, marginBottom: 2 },
  alertText:    { fontSize: 7.5, color: '#7f1d1d', lineHeight: 1.5 },

  // KPI grid
  kpiGrid:      { flexDirection: 'row', gap: 9, marginBottom: 9 },
  kpiCard:      { flex: 1, backgroundColor: LIGHT, borderRadius: 5, padding: 10 },
  kpiCardBlue:  { flex: 1, backgroundColor: '#eff6ff', borderRadius: 5, padding: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  kpiCardRed:   { flex: 1, backgroundColor: '#fef2f2', borderRadius: 5, padding: 10, borderWidth: 1, borderColor: '#fecaca' },
  kpiVal:       { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK },
  kpiValBlue:   { fontSize: 18, fontFamily: 'Helvetica-Bold', color: BLUE },
  kpiValRed:    { fontSize: 18, fontFamily: 'Helvetica-Bold', color: RED },
  kpiLbl:       { fontSize: 7, color: GRAY, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Section
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2, marginTop: 0 },
  sectionBarBlue:{ height: 2, backgroundColor: BLUE, width: 32, marginBottom: 10 },
  sectionBarRed: { height: 2, backgroundColor: RED,  width: 32, marginBottom: 10 },

  // Table
  tableHead:    { flexDirection: 'row', backgroundColor: DARK, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 2 },
  tableHeadBlue:{ flexDirection: 'row', backgroundColor: BLUE, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 2 },
  tableHeadTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.4 },
  tableRow:     { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: LIGHT2 },
  tableRowAlt:  { backgroundColor: '#f8fafc' },
  tableTxt:     { fontSize: 8, color: DARK },
  tableGray:    { fontSize: 8, color: GRAY },
  tableMono:    { fontSize: 7.5, color: GRAY, fontFamily: 'Courier' },

  // Risk badge
  riskCrit:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: RED,    paddingVertical: 2, paddingHorizontal: 4, borderRadius: 3 },
  riskHigh:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: ORANGE, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 3 },
  riskMed:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: YELLOW, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 3 },
  riskLow:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: GREEN,  paddingVertical: 2, paddingHorizontal: 4, borderRadius: 3 },

  // Footer
  footer:     { position: 'absolute', bottom: 20, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTxt:  { fontSize: 7, color: LGRAY },
  pageNum:    { fontSize: 7, color: LGRAY },

  infoBox:    { marginTop: 16, padding: 10, backgroundColor: LIGHT, borderRadius: 4 },
  infoTxt:    { fontSize: 7.5, color: GRAY, lineHeight: 1.5 },
})

function fmtBytes(b: number) {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`
  if (b >= 1_048_576)     return `${(b / 1_048_576).toFixed(1)} MB`
  if (b >= 1024)          return `${(b / 1024).toFixed(0)} KB`
  return `${b} B`
}
function fmtDuration(sec: number) {
  if (!sec || sec <= 0) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0)  return `${h}h ${m}m`
  return `${m}m`
}
function fmt(n: number) { return n.toLocaleString('es-CO') }
function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…' : s }
function fmtDate(s: string) { return s ? s.slice(0, 10) : '—' }

function riskLabel(count: number, ips: number): string {
  if (count >= 80 || ips >= 50) return 'CRÍTICO'
  if (count >= 30 || ips >= 20) return 'ALTO'
  if (count >= 10 || ips >= 5)  return 'MEDIO'
  return 'BAJO'
}
function riskStyle(r: string) {
  if (r === 'CRÍTICO') return s.riskCrit
  if (r === 'ALTO')    return s.riskHigh
  if (r === 'MEDIO')   return s.riskMed
  return s.riskLow
}

function Footer({ brand, page, total }: { brand: string; page: number; total: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>{brand} · Reporte VPN — Confidencial</Text>
      <Text style={s.pageNum}>Pág. {page} / {total}</Text>
    </View>
  )
}

interface Props {
  metrics:    ReportMetrics
  brandName?: string | null
  brandColor?: string | null
}

export function VpnReportPDF({ metrics, brandName }: Props) {
  const brand = brandName ?? 'BCVision'

  // ── Usuarios IPSEC reales (del directorio activo) ──────────
  const ipsecUsers = metrics.vpn_ssl_users
    .filter(u => u.bytes_sent > 0 || u.bytes_received > 0)
    .sort((a, b) => (b.bytes_sent + b.bytes_received) - (a.bytes_sent + a.bytes_received))

  const totalIpsecBytes = ipsecUsers.reduce((a, u) => a + u.bytes_sent + u.bytes_received, 0)
  const totalIpsecUp    = ipsecUsers.reduce((a, u) => a + u.bytes_sent,    0)
  const totalIpsecDown  = ipsecUsers.reduce((a, u) => a + u.bytes_received, 0)

  // ── Ataques de fuerza bruta SSL-VPN ───────────────────────
  const failedLogins = metrics.vpn_failed_logins ?? []
  const attackIps    = (metrics as ReportMetrics & { vpn_attack_ips?: ReportMetrics['vpn_attack_ips'] }).vpn_attack_ips ?? []
  const totalAttacks = failedLogins.reduce((a, u) => a + u.count, 0)
  const uniqueAtkIps = attackIps.length || failedLogins.reduce((s, u) => s + (u.unique_ips ?? 0), 0)
  const vpnDailySorted = [...(metrics.vpn_daily ?? [])].sort((a, b) => a.date.localeCompare(b.date))

  const totalPdf = 3

  return (
    <Document title={`Reporte VPN — ${metrics.period.start} al ${metrics.period.end}`} author={brand}>

      {/* ── PÁGINA 1: Portada + Usuarios IPSEC ──────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.coverBand}>
          <View style={s.accentBar} />
          <View style={s.deco1} />
          <View style={s.deco2} />
          <Text style={s.coverTitle}>Reporte Usuarios VPN</Text>
          <Text style={s.coverSub}>Sesiones IPSEC activas y análisis de seguridad del acceso remoto</Text>
          <View style={s.coverBadge}>
            <Text style={s.coverBadgeTxt}>VPN REPORT</Text>
          </View>
        </View>

        <View style={s.coverBody}>
          <Text style={s.orgName}>{metrics.organization.name}</Text>
          <Text style={s.periodLine}>
            Período: {metrics.period.start} — {metrics.period.end} · {metrics.period.days} día(s)
          </Text>

          {/* KPIs usuarios IPSEC */}
          <View style={s.kpiGrid}>
            <View style={s.kpiCardBlue}>
              <Text style={s.kpiValBlue}>{fmt(ipsecUsers.length)}</Text>
              <Text style={s.kpiLbl}>Usuarios IPSEC activos</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmtBytes(totalIpsecBytes)}</Text>
              <Text style={s.kpiLbl}>Tráfico total</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmtBytes(totalIpsecUp)}</Text>
              <Text style={s.kpiLbl}>Subida (TX)</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmtBytes(totalIpsecDown)}</Text>
              <Text style={s.kpiLbl}>Bajada (RX)</Text>
            </View>
          </View>

          {/* Alerta ataques */}
          {totalAttacks > 0 && (
            <View style={s.alertBox}>
              <View>
                <Text style={s.alertTitle}>⚠ Ataques de fuerza bruta SSL-VPN detectados</Text>
                <Text style={s.alertText}>
                  {fmt(totalAttacks)} intentos fallidos desde {fmt(uniqueAtkIps)} IPs únicas
                  apuntando a {fmt(failedLogins.length)} cuentas. Ver página 3 para análisis completo.
                </Text>
              </View>
            </View>
          )}

          {/* Tabla usuarios IPSEC */}
          <Text style={s.sectionTitle}>Usuarios VPN IPSEC</Text>
          <View style={s.sectionBarBlue} />

          {ipsecUsers.length === 0 ? (
            <View style={{ padding: 16, backgroundColor: LIGHT, borderRadius: 4 }}>
              <Text style={{ fontSize: 8.5, color: GRAY }}>
                Sin sesiones IPSEC con tráfico registradas. Los datos se acumulan con cada ciclo de recolección del agente.
              </Text>
            </View>
          ) : (
            <>
              <View style={s.tableHeadBlue}>
                {['#','Usuario','IP Remota','Tráfico TX','Tráfico RX','Total','Duración','Última conexión'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, {
                    flex: i === 0 ? 0.3 : i === 1 ? 2.2 : i === 2 ? 1.6 : i <= 5 ? 1 : i === 6 ? 0.9 : 1.4,
                  }]}>{h}</Text>
                ))}
              </View>
              {ipsecUsers.map((u, i) => (
                <View key={u.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableGray, { flex: 0.3 }]}>{i + 1}</Text>
                  <Text style={[s.tableTxt, { flex: 2.2, fontFamily: 'Helvetica-Bold' }]}>{trunc(u.user, 24)}</Text>
                  <Text style={[s.tableMono, { flex: 1.6 }]}>{u.ip ?? '—'}</Text>
                  <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(u.bytes_sent)}</Text>
                  <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(u.bytes_received)}</Text>
                  <Text style={[s.tableTxt, { flex: 1 }]}>{fmtBytes(u.bytes_sent + u.bytes_received)}</Text>
                  <Text style={[s.tableGray, { flex: 0.9 }]}>{fmtDuration(u.sessions * 60)}</Text>
                  <Text style={[s.tableGray, { flex: 1.4 }]}>{fmtDate(u.last_seen)}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <Footer brand={brand} page={1} total={totalPdf} />
      </Page>

      {/* ── PÁGINA 2: Actividad diaria + túneles site-to-site ── */}
      <Page size="A4" style={s.page}>
        <View style={s.inner}>
          {/* Timeline diario */}
          {vpnDailySorted.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={s.sectionTitle}>Actividad diaria VPN</Text>
              <View style={s.sectionBarBlue} />
              <View style={s.tableHeadBlue}>
                {['Fecha','Usuarios activos','Tráfico'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, { flex: i === 0 ? 1.5 : 1 }]}>{h}</Text>
                ))}
              </View>
              {vpnDailySorted.slice(-20).map((d, i) => (
                <View key={d.date} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableTxt, { flex: 1.5 }]}>{d.date}</Text>
                  <Text style={[s.tableTxt, { flex: 1 }]}>{fmt(d.active_users)}</Text>
                  <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(d.bytes)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Resumen de tráfico por usuario */}
          <Text style={s.sectionTitle}>Detalle de tráfico por usuario</Text>
          <View style={s.sectionBarBlue} />
          {ipsecUsers.length === 0 ? (
            <View style={s.infoBox}>
              <Text style={s.infoTxt}>
                No hay registros históricos de sesiones IPSEC en el período seleccionado.
                El agente bcOS comienza a acumular historial de sesiones a partir de ahora en intervalos de 1 minuto.
                Los reportes futuros mostrarán datos completos de tráfico histórico.
              </Text>
            </View>
          ) : (
            <>
              <View style={s.tableHeadBlue}>
                {['Usuario','Total','Subida TX','Bajada RX','% del total'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, { flex: i === 0 ? 2 : 1 }]}>{h}</Text>
                ))}
              </View>
              {ipsecUsers.map((u, i) => {
                const pct = totalIpsecBytes > 0
                  ? ((u.bytes_sent + u.bytes_received) / totalIpsecBytes * 100).toFixed(1)
                  : '0.0'
                return (
                  <View key={u.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableTxt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{trunc(u.user, 26)}</Text>
                    <Text style={[s.tableTxt, { flex: 1 }]}>{fmtBytes(u.bytes_sent + u.bytes_received)}</Text>
                    <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(u.bytes_sent)}</Text>
                    <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(u.bytes_received)}</Text>
                    <Text style={[s.tableGray, { flex: 1 }]}>{pct}%</Text>
                  </View>
                )
              })}
            </>
          )}
        </View>

        <Footer brand={brand} page={2} total={totalPdf} />
      </Page>

      {/* ── PÁGINA 3: Ataques de fuerza bruta ───────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.inner}>
          <Text style={s.sectionTitle}>Ataques de fuerza bruta SSL-VPN</Text>
          <View style={s.sectionBarRed} />

          {/* KPIs ataques */}
          <View style={[s.kpiGrid, { marginBottom: 14 }]}>
            <View style={s.kpiCardRed}>
              <Text style={s.kpiValRed}>{fmt(totalAttacks)}</Text>
              <Text style={s.kpiLbl}>Intentos de ataque</Text>
            </View>
            <View style={s.kpiCardRed}>
              <Text style={s.kpiValRed}>{fmt(uniqueAtkIps)}</Text>
              <Text style={s.kpiLbl}>IPs atacantes únicas</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmt(failedLogins.length)}</Text>
              <Text style={s.kpiLbl}>Cuentas objetivo</Text>
            </View>
          </View>

          {failedLogins.length > 0 && (
            <>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 }}>
                Top cuentas objetivo
              </Text>
              <View style={s.tableHead}>
                {['#','Cuenta','Intentos','IPs únicas','Riesgo'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, {
                    flex: i === 0 ? 0.3 : i === 1 ? 2.5 : 1,
                  }]}>{h}</Text>
                ))}
              </View>
              {failedLogins.slice(0, 18).map((u, i) => {
                const r = riskLabel(u.count, u.unique_ips ?? 0)
                return (
                  <View key={u.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableGray, { flex: 0.3 }]}>{i + 1}</Text>
                    <Text style={[s.tableTxt, { flex: 2.5, fontFamily: 'Helvetica-Bold' }]}>{trunc(u.user, 28)}</Text>
                    <Text style={[s.tableTxt, { flex: 1 }]}>{fmt(u.count)}</Text>
                    <Text style={[s.tableGray, { flex: 1 }]}>{fmt(u.unique_ips ?? 0)}</Text>
                    <View style={{ flex: 1 }}><Text style={riskStyle(r)}>{r}</Text></View>
                  </View>
                )
              })}
            </>
          )}

          {attackIps.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 }}>
                Top IPs atacantes
              </Text>
              <View style={s.tableHead}>
                {['#','IP Origen','País','Intentos'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, { flex: i === 0 ? 0.3 : i === 1 ? 2 : i === 2 ? 1.5 : 1 }]}>{h}</Text>
                ))}
              </View>
              {attackIps.slice(0, 10).map((ip, i) => (
                <View key={ip.ip} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableGray, { flex: 0.3 }]}>{i + 1}</Text>
                  <Text style={[s.tableMono,  { flex: 2 }]}>{ip.ip}</Text>
                  <Text style={[s.tableGray,  { flex: 1.5 }]}>{ip.country ?? '—'}</Text>
                  <Text style={[s.tableTxt,   { flex: 1 }]}>{fmt(ip.count)}</Text>
                </View>
              ))}
            </View>
          )}

          {totalAttacks === 0 && (
            <View style={{ padding: 14, backgroundColor: '#f0fdf4', borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: GREEN, fontFamily: 'Helvetica-Bold' }}>
                ✓ Sin ataques de fuerza bruta SSL-VPN en el período analizado.
              </Text>
            </View>
          )}

          <View style={s.infoBox}>
            <Text style={s.infoTxt}>
              Reporte generado automáticamente por {brand} · Los datos IPSEC provienen de la API de monitoreo FortiGate
              (actualización cada minuto). El historial completo se acumula con el tiempo.
              Los ataques de fuerza bruta corresponden a intentos de acceso al portal SSL-VPN desde IPs externas.
              Este documento es confidencial y de uso exclusivo interno.
            </Text>
          </View>
        </View>

        <Footer brand={brand} page={3} total={totalPdf} />
      </Page>

    </Document>
  )
}
