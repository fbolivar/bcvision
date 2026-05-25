import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportMetrics } from '../services/metrics-aggregator'

const DARK   = '#0f172a'
const GRAY   = '#64748b'
const LGRAY  = '#94a3b8'
const LIGHT  = '#f1f5f9'
const LIGHT2 = '#e2e8f0'
const WHITE  = '#ffffff'
const ACCENT = '#0369a1'
const RED    = '#dc2626'
const GREEN  = '#16a34a'

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 9, color: DARK, backgroundColor: WHITE },
  inner:        { paddingTop: 44, paddingBottom: 60, paddingHorizontal: 44 },

  // Header banda
  coverBand:    { height: 200, backgroundColor: ACCENT, position: 'relative', paddingHorizontal: 48, paddingTop: 40, paddingBottom: 28 },
  deco1:        { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)' },
  deco2:        { position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' },
  accentBar:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(255,255,255,0.30)' },
  coverTitle:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4 },
  coverSub:     { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  coverBadge:   { borderRadius: 3, paddingVertical: 5, paddingHorizontal: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)' },
  coverBadgeTxt:{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 1.5 },

  coverBody:    { paddingHorizontal: 48, paddingTop: 28 },
  orgName:      { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 },
  periodLine:   { fontSize: 9, color: GRAY, marginBottom: 20 },

  // KPI grid
  kpiGrid:      { flexDirection: 'row', gap: 12, marginBottom: 10 },
  kpiCard:      { flex: 1, backgroundColor: LIGHT, borderRadius: 6, padding: 12 },
  kpiVal:       { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK },
  kpiLbl:       { fontSize: 7.5, color: GRAY, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2, marginTop: 0 },
  sectionBar:   { height: 2, backgroundColor: ACCENT, width: 36, marginBottom: 12 },

  // Table
  tableHead:    { flexDirection: 'row', backgroundColor: DARK, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 2 },
  tableHeadTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.5 },
  tableRow:     { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: LIGHT2 },
  tableRowAlt:  { backgroundColor: '#f8fafc' },
  tableTxt:     { fontSize: 8, color: DARK },
  tableGray:    { fontSize: 8, color: GRAY },

  // Footer
  footer:       { position: 'absolute', bottom: 22, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTxt:    { fontSize: 7, color: LGRAY },
  pageNum:      { fontSize: 7, color: LGRAY },
})

function fmt(n: number) { return n.toLocaleString('es-CO') }
function fmtBytes(b: number) {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`
  if (b >= 1_048_576)     return `${(b / 1_048_576).toFixed(1)} MB`
  if (b >= 1024)          return `${(b / 1024).toFixed(0)} KB`
  return `${b} B`
}
function fmtDate(s: string) { return s ? s.slice(0, 10) : '—' }
function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…' : s }

function Footer({ brand, page, total }: { brand: string; page: number; total: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>{brand} · Reporte Usuarios VPN · Confidencial</Text>
      <Text style={s.pageNum}>Pág. {page} / {total}</Text>
    </View>
  )
}

interface Props {
  metrics:   ReportMetrics
  brandName?: string | null
  brandColor?: string | null
}

export function VpnReportPDF({ metrics, brandName }: Props) {
  const brand     = brandName ?? 'BCVision'
  const vpnUsers  = metrics.vpn_ssl_users
  const vpnFailed = metrics.vpn_failed_logins
  const vpnDaily  = metrics.vpn_daily ?? []

  const totalSessions   = vpnUsers.reduce((a, u) => a + u.sessions, 0)
  const totalUsers      = vpnUsers.length
  const totalFailed     = vpnFailed.reduce((a, u) => a + u.count, 0)
  const totalBytes      = vpnUsers.reduce((a, u) => a + u.bytes_sent + u.bytes_received, 0)
  const totalBytesIn    = vpnUsers.reduce((a, u) => a + u.bytes_received, 0)
  const totalBytesOut   = vpnUsers.reduce((a, u) => a + u.bytes_sent, 0)

  // Split vpnUsers into pages (max 15 per page)
  const PAGE_SIZE = 15
  const userPages: typeof vpnUsers[] = []
  for (let i = 0; i < vpnUsers.length; i += PAGE_SIZE) {
    userPages.push(vpnUsers.slice(i, i + PAGE_SIZE))
  }
  if (userPages.length === 0) userPages.push([])

  const totalPdf = 1 + userPages.length + 1

  return (
    <Document title={`Reporte VPN — ${metrics.period.start} al ${metrics.period.end}`} author={brand}>

      {/* ── PÁGINA 1: Portada + KPIs ─────────────────────────── */}
      <Page size="A4" style={s.page}>
        {/* Banda de color */}
        <View style={s.coverBand}>
          <View style={s.accentBar} />
          <View style={s.deco1} />
          <View style={s.deco2} />
          <Text style={s.coverTitle}>Reporte Usuarios VPN</Text>
          <Text style={s.coverSub}>Detalle de tráfico y sesiones por usuario de red privada virtual</Text>
          <View style={s.coverBadge}>
            <Text style={s.coverBadgeTxt}>VPN ANALYTICS</Text>
          </View>
        </View>

        {/* Cuerpo portada */}
        <View style={s.coverBody}>
          <Text style={s.orgName}>{metrics.organization.name}</Text>
          <Text style={s.periodLine}>
            Período: {metrics.period.start} — {metrics.period.end} · {metrics.period.days} día(s)
          </Text>

          {/* KPIs */}
          <View style={s.kpiGrid}>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmt(totalUsers)}</Text>
              <Text style={s.kpiLbl}>Usuarios activos</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmt(totalSessions)}</Text>
              <Text style={s.kpiLbl}>Sesiones totales</Text>
            </View>
            <View style={[s.kpiCard, { backgroundColor: totalFailed > 0 ? '#fef2f2' : LIGHT }]}>
              <Text style={[s.kpiVal, { color: totalFailed > 0 ? RED : DARK }]}>{fmt(totalFailed)}</Text>
              <Text style={s.kpiLbl}>Intentos fallidos</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmtBytes(totalBytes)}</Text>
              <Text style={s.kpiLbl}>Tráfico total</Text>
            </View>
          </View>

          {/* Segunda fila KPIs */}
          <View style={[s.kpiGrid, { marginTop: 10 }]}>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmtBytes(totalBytesIn)}</Text>
              <Text style={s.kpiLbl}>Datos recibidos</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmtBytes(totalBytesOut)}</Text>
              <Text style={s.kpiLbl}>Datos enviados</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{totalSessions > 0 && metrics.period.days > 0 ? (totalSessions / metrics.period.days).toFixed(1) : '0'}</Text>
              <Text style={s.kpiLbl}>Sesiones/día</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{totalBytes > 0 && totalSessions > 0 ? fmtBytes(Math.round(totalBytes / totalSessions)) : '0 B'}</Text>
              <Text style={s.kpiLbl}>Tráfico/sesión</Text>
            </View>
          </View>

          {/* Actividad diaria resumen */}
          {vpnDaily.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={s.sectionTitle}>Actividad diaria</Text>
              <View style={s.sectionBar} />
              <View style={s.tableHead}>
                {['Fecha','Sesiones','Usuarios activos','Tráfico'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, { flex: i === 0 ? 1.5 : 1 }]}>{h}</Text>
                ))}
              </View>
              {vpnDaily.slice(-14).map((d, i) => (
                <View key={d.date} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableTxt, { flex: 1.5 }]}>{d.date}</Text>
                  <Text style={[s.tableTxt, { flex: 1 }]}>{fmt(d.sessions)}</Text>
                  <Text style={[s.tableTxt, { flex: 1 }]}>{fmt(d.active_users)}</Text>
                  <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(d.bytes)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Footer brand={brand} page={1} total={totalPdf} />
      </Page>

      {/* ── PÁGINAS 2+: Detalle por usuario ─────────────────── */}
      {userPages.map((chunk, pageIdx) => (
        <Page key={pageIdx} size="A4" style={s.page}>
          <View style={s.inner}>
            {pageIdx === 0 && (
              <>
                <Text style={s.sectionTitle}>Detalle por usuario VPN</Text>
                <View style={s.sectionBar} />
              </>
            )}

            {/* Tabla usuarios */}
            <View style={s.tableHead}>
              {['#','Usuario','IP origen','Sesiones','Bytes In','Bytes Out','Tipo VPN','Grupo','Última conexión'].map((h, i) => (
                <Text key={h} style={[s.tableHeadTxt, {
                  flex: i === 0 ? 0.3 : i === 1 ? 2 : i === 2 ? 1.5 : i <= 4 ? 0.9 : i === 5 ? 0.9 : i === 6 ? 1 : i === 7 ? 1.2 : 1.2,
                }]}>{h}</Text>
              ))}
            </View>
            {chunk.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={[s.tableGray, { textAlign: 'center' }]}>Sin datos de usuarios VPN en el período seleccionado.</Text>
              </View>
            ) : chunk.map((u, i) => {
              const globalIdx = pageIdx * PAGE_SIZE + i
              return (
                <View key={u.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableGray, { flex: 0.3 }]}>{globalIdx + 1}</Text>
                  <Text style={[s.tableTxt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{trunc(u.user, 22)}</Text>
                  <Text style={[s.tableGray, { flex: 1.5, fontFamily: 'Courier' }]}>{u.ip ?? '—'}</Text>
                  <Text style={[s.tableTxt, { flex: 0.9, textAlign: 'center' }]}>{fmt(u.sessions)}</Text>
                  <Text style={[s.tableGray, { flex: 0.9 }]}>{fmtBytes(u.bytes_received)}</Text>
                  <Text style={[s.tableGray, { flex: 0.9 }]}>{fmtBytes(u.bytes_sent)}</Text>
                  <Text style={[s.tableGray, { flex: 1 }]}>{u.tunnel_type ?? 'SSL'}</Text>
                  <Text style={[s.tableGray, { flex: 1.2 }]}>{trunc(u.vpn_group ?? '—', 14)}</Text>
                  <Text style={[s.tableGray, { flex: 1.2 }]}>{fmtDate(u.last_seen)}</Text>
                </View>
              )
            })}
          </View>
          <Footer brand={brand} page={pageIdx + 2} total={totalPdf} />
        </Page>
      ))}

      {/* ── ÚLTIMA PÁGINA: Fallos + notas ───────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.inner}>
          <Text style={s.sectionTitle}>Intentos de conexión fallidos</Text>
          <View style={s.sectionBar} />

          {vpnFailed.length === 0 ? (
            <View style={{ padding: 16, backgroundColor: '#f0fdf4', borderRadius: 4, marginBottom: 20 }}>
              <Text style={{ fontSize: 8.5, color: GREEN, fontFamily: 'Helvetica-Bold' }}>
                ✓ Sin intentos de conexión fallidos en el período. Excelente postura de seguridad VPN.
              </Text>
            </View>
          ) : (
            <>
              <View style={[{ marginBottom: 4, padding: 8, backgroundColor: '#fef2f2', borderRadius: 4 }]}>
                <Text style={{ fontSize: 8, color: RED }}>
                  Se detectaron {fmt(totalFailed)} intentos fallidos de conexión VPN. Revisar si corresponden a accesos no autorizados.
                </Text>
              </View>
              <View style={s.tableHead}>
                {['Usuario / IP','Intentos fallidos','Riesgo'].map(h => (
                  <Text key={h} style={[s.tableHeadTxt, { flex: h === 'Intentos fallidos' ? 0.8 : h === 'Riesgo' ? 0.7 : 2 }]}>{h}</Text>
                ))}
              </View>
              {vpnFailed.map((f, i) => {
                const risk = f.count >= 50 ? 'ALTO' : f.count >= 10 ? 'MEDIO' : 'BAJO'
                const riskColor = f.count >= 50 ? RED : f.count >= 10 ? '#d97706' : GREEN
                return (
                  <View key={f.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableTxt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{trunc(f.user, 30)}</Text>
                    <Text style={[s.tableTxt, { flex: 0.8, textAlign: 'center' }]}>{fmt(f.count)}</Text>
                    <Text style={[s.tableHeadTxt, { flex: 0.7, color: riskColor }]}>{risk}</Text>
                  </View>
                )
              })}
            </>
          )}

          {/* Top usuarios por tráfico */}
          <View style={{ marginTop: 24 }}>
            <Text style={s.sectionTitle}>Top 10 usuarios por tráfico</Text>
            <View style={s.sectionBar} />
            <View style={s.tableHead}>
              {['#','Usuario','Total','Descarga','Subida','Sesiones'].map((h, i) => (
                <Text key={h} style={[s.tableHeadTxt, { flex: i === 0 ? 0.3 : i === 1 ? 2 : 1 }]}>{h}</Text>
              ))}
            </View>
            {vpnUsers.slice(0, 10).map((u, i) => (
              <View key={u.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableGray, { flex: 0.3 }]}>{i + 1}</Text>
                <Text style={[s.tableTxt, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{trunc(u.user, 22)}</Text>
                <Text style={[s.tableTxt, { flex: 1 }]}>{fmtBytes(u.bytes_sent + u.bytes_received)}</Text>
                <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(u.bytes_received)}</Text>
                <Text style={[s.tableGray, { flex: 1 }]}>{fmtBytes(u.bytes_sent)}</Text>
                <Text style={[s.tableGray, { flex: 1 }]}>{fmt(u.sessions)}</Text>
              </View>
            ))}
          </View>

          {/* Nota al pie */}
          <View style={{ marginTop: 30, padding: 10, backgroundColor: LIGHT, borderRadius: 4 }}>
            <Text style={{ fontSize: 7.5, color: GRAY, lineHeight: 1.5 }}>
              Este reporte fue generado automáticamente por {brand} a partir de los logs de firewall registrados durante el período indicado.
              Los datos de tráfico corresponden a sesiones VPN procesadas por el agente bcOS y sincronizadas con la plataforma.
              Este documento es de carácter confidencial y de uso exclusivo interno.
            </Text>
          </View>
        </View>
        <Footer brand={brand} page={totalPdf} total={totalPdf} />
      </Page>

    </Document>
  )
}
