import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportMetrics } from '../services/metrics-aggregator'

const DARK    = '#0f172a'
const GRAY    = '#64748b'
const LGRAY   = '#94a3b8'
const LIGHT   = '#f1f5f9'
const LIGHT2  = '#e2e8f0'
const WHITE   = '#ffffff'
const ACCENT  = '#b91c1c'   // red — security alert report
const RED     = '#dc2626'
const ORANGE  = '#ea580c'
const YELLOW  = '#ca8a04'
const GREEN   = '#16a34a'

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 9, color: DARK, backgroundColor: WHITE },
  inner:        { paddingTop: 36, paddingBottom: 60, paddingHorizontal: 44 },

  coverBand:    { height: 190, backgroundColor: ACCENT, position: 'relative', paddingHorizontal: 48, paddingTop: 36, paddingBottom: 24 },
  deco1:        { position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  deco2:        { position: 'absolute', bottom: -15, right: 70, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.04)' },
  accentBar:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(255,255,255,0.30)' },
  coverTitle:   { fontSize: 21, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4 },
  coverSub:     { fontSize: 8.5, color: 'rgba(255,255,255,0.75)', marginBottom: 18 },
  coverBadge:   { borderRadius: 3, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.12)' },
  coverBadgeTxt:{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 1.5 },

  coverBody:    { paddingHorizontal: 48, paddingTop: 24 },
  orgName:      { fontSize: 17, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 },
  periodLine:   { fontSize: 8.5, color: GRAY, marginBottom: 18 },

  // Alert box
  alertBox:     { flexDirection: 'row', backgroundColor: '#fef2f2', borderRadius: 5, padding: 10, marginBottom: 18, borderLeftWidth: 4, borderLeftColor: RED },
  alertTitle:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: RED, marginBottom: 3 },
  alertText:    { fontSize: 8, color: '#7f1d1d', lineHeight: 1.5 },

  // KPI grid
  kpiGrid:      { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard:      { flex: 1, backgroundColor: LIGHT, borderRadius: 5, padding: 11 },
  kpiCardRed:   { flex: 1, backgroundColor: '#fef2f2', borderRadius: 5, padding: 11, borderWidth: 1, borderColor: '#fecaca' },
  kpiVal:       { fontSize: 19, fontFamily: 'Helvetica-Bold', color: DARK },
  kpiValRed:    { fontSize: 19, fontFamily: 'Helvetica-Bold', color: RED },
  kpiLbl:       { fontSize: 7, color: GRAY, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Section
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2, marginTop: 0 },
  sectionBar:   { height: 2, backgroundColor: ACCENT, width: 32, marginBottom: 10 },

  // Table
  tableHead:    { flexDirection: 'row', backgroundColor: DARK, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 2 },
  tableHeadTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.4 },
  tableRow:     { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: LIGHT2 },
  tableRowAlt:  { backgroundColor: '#f8fafc' },
  tableTxt:     { fontSize: 8, color: DARK },
  tableGray:    { fontSize: 8, color: GRAY },
  tableMono:    { fontSize: 7.5, color: GRAY, fontFamily: 'Courier' },

  // Risk badge
  riskHigh:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: RED,    paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3 },
  riskMed:      { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: ORANGE, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3 },
  riskLow:      { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: YELLOW, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3 },

  // Footer
  footer:       { position: 'absolute', bottom: 20, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTxt:    { fontSize: 7, color: LGRAY },
  pageNum:      { fontSize: 7, color: LGRAY },

  // Info note
  infoBox:      { marginTop: 20, padding: 10, backgroundColor: LIGHT, borderRadius: 4 },
  infoTxt:      { fontSize: 7.5, color: GRAY, lineHeight: 1.5 },
})

function fmt(n: number) { return n.toLocaleString('es-CO') }
function fmtDate(s: string) { return s ? s.slice(0, 10) : '—' }
function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…' : s }

function risk(count: number, uniqueIps: number): 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO' {
  if (count >= 80 || uniqueIps >= 50) return 'CRÍTICO'
  if (count >= 30 || uniqueIps >= 20) return 'ALTO'
  if (count >= 10 || uniqueIps >= 5)  return 'MEDIO'
  return 'BAJO'
}
function riskStyle(r: string) {
  if (r === 'CRÍTICO') return s.riskHigh
  if (r === 'ALTO')    return s.riskHigh
  if (r === 'MEDIO')   return s.riskMed
  return s.riskLow
}

function Footer({ brand, page, total }: { brand: string; page: number; total: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>{brand} · Análisis de Seguridad VPN · Confidencial</Text>
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
  const brand       = brandName ?? 'BCVision'
  const failedLogins = metrics.vpn_failed_logins ?? []
  const attackIps    = (metrics as ReportMetrics & { vpn_attack_ips?: ReportMetrics['vpn_attack_ips'] }).vpn_attack_ips ?? []
  const vpnDaily     = metrics.vpn_daily ?? []

  const totalAttempts   = failedLogins.reduce((a, u) => a + u.count, 0)
  const uniqueUsernames = failedLogins.length
  const uniqueAttackIps = attackIps.length || failedLogins.reduce((s, u) => s + (u.unique_ips ?? 0), 0)

  // Peak attack day from vpnDaily
  const peakDay = vpnDaily.length > 0
    ? vpnDaily.sort((a, b) => b.sessions - a.sessions)[0]?.date ?? '—'
    : '—'
  const vpnDailySorted = [...vpnDaily].sort((a, b) => a.date.localeCompare(b.date))

  // Has successful sessions?
  const hasSessions = metrics.vpn_ssl_users.length > 0

  const totalPdf = 3

  return (
    <Document title={`Análisis Seguridad VPN — ${metrics.period.start} al ${metrics.period.end}`} author={brand}>

      {/* ── PÁGINA 1: Portada + KPIs + Alerta + Timeline ───── */}
      <Page size="A4" style={s.page}>
        <View style={s.coverBand}>
          <View style={s.accentBar} />
          <View style={s.deco1} />
          <View style={s.deco2} />
          <Text style={s.coverTitle}>Análisis de Seguridad VPN</Text>
          <Text style={s.coverSub}>Detección de ataques de fuerza bruta y credential stuffing en acceso VPN</Text>
          <View style={s.coverBadge}>
            <Text style={s.coverBadgeTxt}>SECURITY REPORT</Text>
          </View>
        </View>

        <View style={s.coverBody}>
          <Text style={s.orgName}>{metrics.organization.name}</Text>
          <Text style={s.periodLine}>
            Período: {metrics.period.start} — {metrics.period.end} · {metrics.period.days} día(s) analizados
          </Text>

          {/* Alerta */}
          {totalAttempts > 0 && (
            <View style={s.alertBox}>
              <View>
                <Text style={s.alertTitle}>⚠ Ataque de Credential Stuffing Detectado</Text>
                <Text style={s.alertText}>
                  Se registraron {fmt(totalAttempts)} intentos fallidos de acceso VPN provenientes de{' '}
                  {fmt(uniqueAttackIps)} IPs únicas apuntando a {fmt(uniqueUsernames)} cuentas distintas.
                  El patrón indica un ataque automatizado de fuerza bruta distribuido.
                  Se recomienda revisar las reglas de acceso VPN y habilitar MFA.
                </Text>
              </View>
            </View>
          )}

          {/* KPIs fila 1 */}
          <View style={s.kpiGrid}>
            <View style={s.kpiCardRed}>
              <Text style={s.kpiValRed}>{fmt(totalAttempts)}</Text>
              <Text style={s.kpiLbl}>Intentos de ataque</Text>
            </View>
            <View style={s.kpiCardRed}>
              <Text style={s.kpiValRed}>{fmt(uniqueAttackIps)}</Text>
              <Text style={s.kpiLbl}>IPs atacantes únicas</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{fmt(uniqueUsernames)}</Text>
              <Text style={s.kpiLbl}>Cuentas objetivo</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiVal}>{metrics.period.days}</Text>
              <Text style={s.kpiLbl}>Días de análisis</Text>
            </View>
          </View>

          {/* Timeline diario */}
          {vpnDailySorted.length > 0 && (
            <View style={{ marginTop: 18 }}>
              <Text style={s.sectionTitle}>Actividad diaria de ataques VPN</Text>
              <View style={s.sectionBar} />
              <View style={s.tableHead}>
                {['Fecha', 'Intentos fallidos', 'Usuarios afectados'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, { flex: i === 0 ? 1.8 : 1 }]}>{h}</Text>
                ))}
              </View>
              {vpnDailySorted.slice(-20).map((d, i) => (
                <View key={d.date} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableTxt, { flex: 1.8 }]}>{d.date}</Text>
                  <Text style={[s.tableTxt, { flex: 1 }]}>{fmt(d.sessions)}</Text>
                  <Text style={[s.tableGray, { flex: 1 }]}>{fmt(d.active_users)}</Text>
                </View>
              ))}
            </View>
          )}

          {totalAttempts === 0 && (
            <View style={{ padding: 16, backgroundColor: '#f0fdf4', borderRadius: 4, marginTop: 12 }}>
              <Text style={{ fontSize: 9, color: GREEN, fontFamily: 'Helvetica-Bold' }}>
                ✓ Sin intentos fallidos de conexión VPN en el período analizado.
              </Text>
              <Text style={{ fontSize: 8, color: GRAY, marginTop: 4 }}>
                El acceso VPN no registró ataques de fuerza bruta ni credential stuffing durante este período.
              </Text>
            </View>
          )}
        </View>

        <Footer brand={brand} page={1} total={totalPdf} />
      </Page>

      {/* ── PÁGINA 2: Cuentas objetivo ───────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.inner}>
          <Text style={s.sectionTitle}>Cuentas objetivo del ataque</Text>
          <View style={s.sectionBar} />
          <Text style={{ fontSize: 8, color: GRAY, marginBottom: 10 }}>
            Usuarios o cuentas de servicio a los que se intentó acceder. Múltiples IPs por cuenta
            indica credential stuffing distribuido (botnet). Cuentas como &apos;oracle&apos;, &apos;admin&apos;,
            &apos;test&apos; son señuelos habituales de atacantes automatizados.
          </Text>

          <View style={s.tableHead}>
            {['#', 'Cuenta objetivo', 'Intentos', 'IPs únicas', 'Riesgo'].map((h, i) => (
              <Text key={h} style={[s.tableHeadTxt, {
                flex: i === 0 ? 0.35 : i === 1 ? 2.5 : i === 2 ? 1 : i === 3 ? 1 : 1,
              }]}>{h}</Text>
            ))}
          </View>

          {failedLogins.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={s.tableGray}>Sin intentos fallidos registrados en el período.</Text>
            </View>
          ) : failedLogins.slice(0, 30).map((u, i) => {
            const r = risk(u.count, u.unique_ips ?? 0)
            return (
              <View key={u.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableGray, { flex: 0.35 }]}>{i + 1}</Text>
                <Text style={[s.tableTxt, { flex: 2.5, fontFamily: 'Helvetica-Bold' }]}>
                  {trunc(u.user, 30)}
                </Text>
                <Text style={[s.tableTxt, { flex: 1 }]}>{fmt(u.count)}</Text>
                <Text style={[s.tableGray, { flex: 1 }]}>{fmt(u.unique_ips ?? 0)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={riskStyle(r)}>{r}</Text>
                </View>
              </View>
            )
          })}

          <View style={[s.infoBox, { marginTop: 16 }]}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 }}>
              Interpretación de niveles de riesgo:
            </Text>
            <Text style={s.infoTxt}>
              CRÍTICO: 80+ intentos o 50+ IPs distintas — atacante altamente persistente, bloqueo inmediato recomendado.{'\n'}
              ALTO: 30-79 intentos o 20-49 IPs — ataque moderado-severo, monitoreo activo requerido.{'\n'}
              MEDIO: 10-29 intentos o 5-19 IPs — intentos múltiples, probable escaneo automatizado.{'\n'}
              BAJO: menos de 10 intentos — intentos aislados o escaneos de baja intensidad.
            </Text>
          </View>
        </View>

        <Footer brand={brand} page={2} total={totalPdf} />
      </Page>

      {/* ── PÁGINA 3: IPs atacantes + recomendaciones ───────── */}
      <Page size="A4" style={s.page}>
        <View style={s.inner}>

          {/* IPs atacantes */}
          {attackIps.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={s.sectionTitle}>IPs atacantes más activas</Text>
              <View style={s.sectionBar} />
              <View style={s.tableHead}>
                {['#', 'Dirección IP', 'País', 'Intentos'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, {
                    flex: i === 0 ? 0.35 : i === 1 ? 2 : i === 2 ? 1.5 : 1,
                  }]}>{h}</Text>
                ))}
              </View>
              {attackIps.slice(0, 20).map((ip, i) => (
                <View key={ip.ip} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableGray, { flex: 0.35 }]}>{i + 1}</Text>
                  <Text style={[s.tableMono, { flex: 2 }]}>{ip.ip}</Text>
                  <Text style={[s.tableGray, { flex: 1.5 }]}>{ip.country ?? '—'}</Text>
                  <Text style={[s.tableTxt, { flex: 1 }]}>{fmt(ip.count)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Sesiones legítimas (si hay) */}
          {hasSessions && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionTitle}>Sesiones VPN legítimas</Text>
              <View style={s.sectionBar} />
              <View style={s.tableHead}>
                {['Usuario', 'Sesiones', 'IP'].map((h, i) => (
                  <Text key={h} style={[s.tableHeadTxt, { flex: i === 1 ? 0.8 : 1.5 }]}>{h}</Text>
                ))}
              </View>
              {metrics.vpn_ssl_users.slice(0, 10).map((u, i) => (
                <View key={u.user} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableTxt, { flex: 1.5, fontFamily: 'Helvetica-Bold' }]}>{trunc(u.user, 22)}</Text>
                  <Text style={[s.tableTxt, { flex: 0.8 }]}>{fmt(u.sessions)}</Text>
                  <Text style={[s.tableMono, { flex: 1.5 }]}>{u.ip ?? '—'}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recomendaciones */}
          <View style={{ marginTop: attackIps.length > 0 ? 4 : 0 }}>
            <Text style={s.sectionTitle}>Recomendaciones de seguridad</Text>
            <View style={s.sectionBar} />
            {[
              { title: 'Habilitar autenticación multifactor (MFA)',
                desc: 'Implementar MFA en el portal VPN elimina prácticamente el riesgo de acceso por credential stuffing, incluso si las credenciales están comprometidas.' },
              { title: 'Bloquear IPs atacantes a nivel de firewall',
                desc: 'Agregar las IPs identificadas en este reporte a la lista de bloqueo del FortiGate. Considerar suscripción a feeds de threat intelligence para bloqueo automático.' },
              { title: 'Deshabilitar cuentas de servicio en el portal VPN',
                desc: 'Cuentas como "oracle", "admin", "test", "production" no deberían tener acceso VPN. Deshabilitar o remover del directorio activo si no están en uso.' },
              { title: 'Configurar rate limiting en el portal SSL-VPN',
                desc: 'FortiGate permite limitar intentos de login por IP. Configurar bloqueo temporal tras 5 intentos fallidos reduce significativamente el volumen de ataques.' },
            ].map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
                <Text style={{ fontSize: 8, color: ACCENT, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{i + 1}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 }}>{r.title}</Text>
                  <Text style={{ fontSize: 7.5, color: GRAY, lineHeight: 1.5 }}>{r.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoTxt}>
              Este reporte fue generado automáticamente por {brand} a partir de eventos de firewall del período indicado.
              Los datos provienen del agente bcOS sincronizado con FortiGate. Este documento es confidencial y de uso exclusivo interno.
              Para configurar el reenvío de sesiones VPN exitosas al agente y obtener métricas de tráfico completas,
              contacte al equipo de soporte de {brand}.
            </Text>
          </View>
        </View>

        <Footer brand={brand} page={3} total={totalPdf} />
      </Page>

    </Document>
  )
}
