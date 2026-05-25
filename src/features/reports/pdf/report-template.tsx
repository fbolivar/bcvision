import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { ReportMetrics } from '../services/metrics-aggregator'
import type { GeneratedReport, ExecutiveReport, TechnicalReport, ComplianceReport } from '../services/claude-report.service'

// ─── Palette ────────────────────────────────────────────────────────────────
const DARK   = '#0f172a'
const GRAY   = '#64748b'
const LGRAY  = '#94a3b8'
const LIGHT  = '#f1f5f9'
const LIGHT2 = '#e2e8f0'
const RED    = '#dc2626'
const GREEN  = '#16a34a'
const AMBER  = '#d97706'
const WHITE  = '#ffffff'

const ACCENT: Record<string, string> = {
  executive:  '#1d4ed8',
  technical:  '#7c3aed',
  compliance: '#0f766e',
}

const TYPE_LABELS: Record<string, string> = {
  executive:  'REPORTE EJECUTIVO',
  technical:  'REPORTE TÉCNICO',
  compliance: 'REPORTE DE CUMPLIMIENTO',
}

const TYPE_SUBTITLES: Record<string, string> = {
  executive:  'Resumen de seguridad para dirección y gerencia',
  technical:  'Análisis técnico de amenazas y tráfico de red',
  compliance: 'Evaluación de controles y cumplimiento normativo',
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page
  page:           { fontFamily: 'Helvetica', fontSize: 9, color: DARK, backgroundColor: WHITE },
  pageInner:      { paddingTop: 44, paddingBottom: 60, paddingHorizontal: 44 },

  // ── Cover: band (top ~40% of page) ──────────────────────────────────────
  coverBand:      { height: 346, overflow: 'hidden', position: 'relative' },
  coverBandInner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 48, paddingTop: 50, paddingBottom: 38, justifyContent: 'space-between' },
  coverDeco1:     { position: 'absolute', top: -48, right: -48, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  coverDeco2:     { position: 'absolute', bottom: -30, right: 40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' },
  coverAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(255,255,255,0.30)' },

  coverBrandRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  coverLogo:      { fontSize: 30, fontFamily: 'Helvetica-Bold', color: WHITE, flexWrap: 'wrap', maxWidth: 320 },
  coverSubtitle:  { fontSize: 8.5, color: 'rgba(255,255,255,0.58)', marginTop: 4, letterSpacing: 0.4 },

  coverBadge:     { borderRadius: 3, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)', backgroundColor: 'rgba(255,255,255,0.13)' },
  coverBadgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 2 },

  // ── Cover: white body ────────────────────────────────────────────────────
  coverBody:      { flex: 1, paddingHorizontal: 48, paddingTop: 32 },
  coverOrgName:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: DARK, flexWrap: 'wrap', maxWidth: 460 },
  coverTypeLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginTop: 5, letterSpacing: 0.3 },

  // KPI mini-cards on cover
  coverKpiGrid:   { flexDirection: 'row', gap: 10, marginTop: 22 },
  coverKpiCard:   { flex: 1, borderRadius: 4, padding: '10 12', borderLeftWidth: 3 },
  coverKpiValue:  { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK },
  coverKpiLabel:  { fontSize: 6.5, color: GRAY, marginTop: 3, letterSpacing: 0.5 },

  coverRiskBox:   { marginTop: 14, borderRadius: 4, padding: '10 16', alignSelf: 'flex-start' },
  coverRiskLabel: { fontSize: 8, color: 'rgba(255,255,255,0.72)', marginBottom: 2 },
  coverRiskValue: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: WHITE },

  // ── Cover: footer ────────────────────────────────────────────────────────
  coverFooter:    { paddingHorizontal: 48, paddingBottom: 26 },
  coverDivider:   { height: 1, backgroundColor: LIGHT2, marginBottom: 12 },
  coverFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverFooterTxt: { fontSize: 7.5, color: LGRAY },
  coverConfid:    { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // ── Inner page header ────────────────────────────────────────────────────
  pageHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, paddingBottom: 12, borderBottomWidth: 1.5 },
  pageHeaderLogo: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  pageHeaderMeta: { fontSize: 7.5, color: GRAY, textAlign: 'right', maxWidth: 200, flexShrink: 1 },

  // ── Sections ─────────────────────────────────────────────────────────────
  section:      { marginBottom: 18 },
  sectionTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 10, paddingHorizontal: 8, paddingVertical: 5, borderLeftWidth: 3, borderRadius: 2 },
  bodyText:     { fontSize: 9, lineHeight: 1.60, color: DARK, marginBottom: 6 },

  // ── KPI grid (inner pages) ────────────────────────────────────────────────
  kpiGrid:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  kpiBox:    { borderRadius: 4, padding: '10 12', flex: 1, minWidth: '28%', borderLeftWidth: 3 },
  kpiValue:  { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK },
  kpiLabel:  { fontSize: 7, color: GRAY, marginTop: 3, letterSpacing: 0.3 },

  // ── Risk box ──────────────────────────────────────────────────────────────
  riskBox:   { borderRadius: 4, padding: '10 16', alignSelf: 'flex-start', marginBottom: 12 },
  riskLabel: { fontSize: 8, color: 'rgba(255,255,255,0.72)', marginBottom: 3 },
  riskValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE },

  // ── List ─────────────────────────────────────────────────────────────────
  listItem:  { flexDirection: 'row', marginBottom: 5 },
  bullet:    { width: 14, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  listText:  { flex: 1, fontSize: 9, lineHeight: 1.45, color: DARK },

  // ── Recommendation box ────────────────────────────────────────────────────
  recBox:    { borderLeftWidth: 3, padding: '8 10', marginBottom: 8, borderRadius: 2 },
  recNumber: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  recText:   { fontSize: 9, color: DARK, lineHeight: 1.45 },

  // ── Table ─────────────────────────────────────────────────────────────────
  table:     { width: '100%', marginTop: 4 },
  tHead:     { flexDirection: 'row', padding: '5 6', borderRadius: 3 },
  tHeadText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, flex: 1 },
  tRow:      { flexDirection: 'row', padding: '5 6', borderBottomWidth: 1, borderBottomColor: LIGHT2 },
  tRowAlt:   { flexDirection: 'row', padding: '5 6', backgroundColor: LIGHT, borderBottomWidth: 1, borderBottomColor: LIGHT2 },
  tCell:     { fontSize: 8, color: DARK, flex: 1 },

  // ── TOC ───────────────────────────────────────────────────────────────────
  tocTitle:    { fontSize: 22, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 },
  tocSubtitle: { fontSize: 9, color: GRAY, marginBottom: 22 },
  tocItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LIGHT2 },
  tocNum:      { fontSize: 20, fontFamily: 'Helvetica-Bold', width: 42, color: LIGHT2 },
  tocLabel:    { fontSize: 10, color: DARK, flex: 1, fontFamily: 'Helvetica-Bold' },
  tocDesc:     { fontSize: 8, color: LGRAY, marginTop: 2 },
  tocPage:     { fontSize: 11, fontFamily: 'Helvetica-Bold', width: 28, textAlign: 'right' },

  // ── Severity bar ──────────────────────────────────────────────────────────
  sevRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sevLabel:  { width: 62, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  sevBarBg:  { flex: 1, backgroundColor: LIGHT2, height: 8, borderRadius: 4, marginHorizontal: 8 },
  sevBarFill:{ height: 8, borderRadius: 4 },
  sevCount:  { width: 84, fontSize: 8, textAlign: 'right', color: GRAY },

  // ── Audit finding ─────────────────────────────────────────────────────────
  auditRow:      { flexDirection: 'row', marginBottom: 8, padding: '8 10', borderRadius: 3, borderWidth: 1 },
  auditBadge:    { borderRadius: 3, paddingVertical: 3, paddingHorizontal: 6, alignSelf: 'flex-start', marginRight: 10, minWidth: 76, alignItems: 'center' },
  auditBadgeText:{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE },
  auditText:     { flex: 1, fontSize: 8, lineHeight: 1.45, color: DARK },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer:    { position: 'absolute', bottom: 20, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: LIGHT2, paddingTop: 7 },
  footerText:{ fontSize: 7, color: LGRAY },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatNum(n: number) { return n.toLocaleString('es-CO') }
function formatBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}
function trunc(str: string, max: number) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

function parseAuditStatus(text: string): { status: string; color: string } {
  if (/CONFORME/i.test(text) && !/NO CONFORME/i.test(text)) return { status: 'CONFORME', color: GREEN }
  if (/NO CONFORME/i.test(text)) return { status: 'NO CONFORME', color: RED }
  if (/PARCIAL|PENDIENTE/i.test(text)) return { status: 'PARCIAL', color: AMBER }
  return { status: 'REVISAR', color: GRAY }
}

interface Props {
  metrics: ReportMetrics
  narrative: GeneratedReport | null
  reportType: string
  brandName?: string | null
  brandColor?: string | null
  logoUrl?: string | null
}

export function ReportPDF({ metrics, narrative, reportType, brandName, brandColor, logoUrl }: Props) {
  const {
    summary, period, organization, top_threats, top_blocked_ips, top_users, severity_breakdown, top_protocols,
    intrusion_top, intrusion_not_blocked, attack_src_ips, attack_src_countries, users_hit_intrusion,
    users_hit_malware, users_hit_adware, users_hit_spyware, botnet_sources, phishing_users,
    top_apps_blocked, proxy_users, top_apps_by_category, vpn_ssl_users, vpn_failed_logins,
    session_history, traffic_stats,
    trends, ipsec_active_count, top_attack_country,
  } = metrics

  const acc       = brandColor ?? ACCENT[reportType] ?? ACCENT.executive
  const logoText  = brandName ?? 'BCVision'
  const orgName   = organization.name
  const orgShort  = trunc(orgName, 30)
  const now       = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  const isExec = reportType === 'executive'
  const isTech = reportType === 'technical'
  const isComp = reportType === 'compliance'
  const exec   = isExec && narrative ? narrative as ExecutiveReport : null
  const tech   = isTech && narrative ? narrative as TechnicalReport : null
  const comp   = isComp && narrative ? narrative as ComplianceReport : null

  const riskColors: Record<string, string> = { BAJO: GREEN, MEDIO: AMBER, ALTO: RED, CRÍTICO: RED }
  const riskColor = exec ? (riskColors[exec.risk_level] ?? GRAY) : acc

  const ipsecActiveCount = ipsec_active_count ?? 0
  const topAttackCountry = top_attack_country ?? null

  function trendTxt(delta: number | null | undefined, unit = '%'): string {
    if (delta == null) return ''
    return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}${unit}`
  }
  function trendClr(delta: number | null | undefined, lowerIsBetter = true): string {
    if (delta == null || delta === 0) return GRAY
    return (delta < 0) === lowerIsBetter ? GREEN : RED
  }

  // ── Blank-page guards for technical report ──────────────────────────────
  const hasIntrusionContent = !!(
    (intrusion_top?.length) || (intrusion_not_blocked?.length) ||
    (attack_src_ips?.length) || (attack_src_countries?.length) || (users_hit_intrusion?.length)
  )
  const hasMalwareContent = !!(
    (users_hit_malware?.length) || (users_hit_adware?.length) ||
    (users_hit_spyware?.length) || (botnet_sources?.length) || (phishing_users?.length)
  )
  const hasAppContent = !!(
    (top_apps_blocked?.length) || (proxy_users?.length) ||
    (top_apps_by_category?.length) || (top_users?.length)
  )
  const hasVpnContent = !!(
    (vpn_ssl_users?.length) || (vpn_failed_logins?.length) || (session_history?.length)
  )
  const hasTrafficContent = !!(traffic_stats || tech)

  // ── Reusable components ─────────────────────────────────────────────────
  const Footer = () => (
    <View style={s.footer} fixed>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {logoUrl ? <Image src={logoUrl} style={{ width: 11, height: 11, objectFit: 'contain' }} /> : null}
        <Text style={s.footerText}>{logoText} · {trunc(orgName, 36)} · {TYPE_LABELS[reportType] ?? ''} · Confidencial</Text>
      </View>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  )

  const PageHeader = ({ subtitle }: { subtitle: string }) => (
    <View style={[s.pageHeader, { borderBottomColor: acc }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {logoUrl ? <Image src={logoUrl} style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
        <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]}{'\n'}{orgShort}{'\n'}{subtitle}</Text>
      </View>
    </View>
  )

  const SectionTitle = ({ children, color }: { children: string | number; color?: string }) => {
    const c = color ?? acc
    return (
      <View style={[s.sectionTitle, { borderLeftColor: c, backgroundColor: `${c}0d` }]}>
        <Text style={{ color: c }}>{children}</Text>
      </View>
    )
  }

  // ─── TOC items per report type ──────────────────────────────────────────
  const tocItems = isExec ? [
    { num: '01', label: 'Portada',                    desc: 'Identificación del reporte y período',           page: 1 },
    { num: '02', label: 'Tabla de Contenido',         desc: 'Índice del documento',                          page: 2 },
    { num: '03', label: 'Métricas del Período',       desc: 'KPIs ejecutivos, resumen e impacto al negocio', page: 3 },
    { num: '04', label: 'Recomendaciones',            desc: 'Acciones prioritarias y distribución de severidad', page: 4 },
  ] : isTech ? [
    { num: '01', label: 'Portada',                    desc: 'Identificación del reporte y período',           page: 1 },
    { num: '02', label: 'Tabla de Contenido',         desc: 'Índice del documento',                          page: 2 },
    { num: '03', label: 'IPS / Intrusión',            desc: 'Top ataques, IPs origen, usuarios afectados',   page: 3 },
    { num: '04', label: 'Malware · Botnet · Phishing',desc: 'Usuarios afectados y fuentes detectadas',       page: 4 },
    { num: '05', label: 'Aplicaciones y Usuarios',    desc: 'Apps bloqueadas, proxy y consumo de ancho de banda', page: 5 },
    { num: '06', label: 'VPN e Historial',            desc: 'Usuarios VPN, logins fallidos y sesiones',      page: 6 },
    { num: '07', label: 'Estadísticas y Recomendaciones', desc: 'Tráfico y acciones técnicas',               page: 7 },
  ] : [
    { num: '01', label: 'Portada',                    desc: 'Identificación del reporte y período',           page: 1 },
    { num: '02', label: 'Tabla de Contenido',         desc: 'Índice del documento',                          page: 2 },
    { num: '03', label: 'Resumen de Cumplimiento',    desc: 'Estado normativo y métricas de auditoría',      page: 3 },
    { num: '04', label: 'Hallazgos de Auditoría',     desc: 'Evaluación de controles y brechas regulatorias', page: 4 },
    { num: '05', label: 'Plan de Remediación',        desc: 'Evidencia forense, remediación y firmas',       page: 5 },
  ]

  return (
    <Document title={`${TYPE_LABELS[reportType]} — ${orgName}`} author={logoText}>

      {/* ══════════════════════════════════════════════════════
          PORTADA
      ══════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>

        {/* Colored band — ~40% of page */}
        <View style={[s.coverBand, { backgroundColor: acc }]}>
          {/* Decorative circles */}
          <View style={s.coverDeco1} />
          <View style={s.coverDeco2} />
          {/* Thin accent left bar */}
          <View style={s.coverAccentBar} />

          <View style={s.coverBandInner}>
            {/* Brand top */}
            <View style={s.coverBrandRow}>
              {logoUrl ? <Image src={logoUrl} style={{ width: 52, height: 52, objectFit: 'contain' }} /> : null}
              <View>
                <Text style={s.coverLogo}>{logoText}</Text>
                <Text style={s.coverSubtitle}>Firewall Analytics Platform · BC Fabric SAS</Text>
              </View>
            </View>

            {/* Report type badge — bottom of band */}
            <View style={s.coverBadge}>
              <Text style={s.coverBadgeText}>{TYPE_LABELS[reportType] ?? 'REPORTE'}</Text>
            </View>
          </View>
        </View>

        {/* White body */}
        <View style={s.coverBody}>
          {/* Org name */}
          <Text style={s.coverOrgName}>{orgName}</Text>
          <View style={{ width: 40, height: 3, backgroundColor: acc, marginTop: 10, marginBottom: 2, borderRadius: 2 }} />
          <Text style={[s.coverTypeLabel, { color: acc }]}>{TYPE_SUBTITLES[reportType] ?? ''}</Text>

          {/* KPI mini-cards */}
          <View style={s.coverKpiGrid}>
            {([
              { v: formatNum(summary.total_events),  l: 'EVENTOS TOTALES',   c: acc,  d: trends?.total_events_delta_pct ?? null, lib: true,  unit: '%' },
              { v: `${summary.block_rate_pct}%`,     l: 'TASA DE BLOQUEO',   c: summary.block_rate_pct >= 80 ? GREEN : AMBER, d: trends?.block_rate_delta_pts ?? null, lib: false, unit: ' pts' },
              { v: String(summary.active_devices),   l: 'DISPOSITIVOS',      c: DARK, d: null, lib: true,  unit: '%' },
              { v: formatBytes(summary.bytes_total), l: 'TRÁFICO ANALIZADO', c: DARK, d: null, lib: true,  unit: '%' },
            ] as Array<{ v: string; l: string; c: string; d: number | null; lib: boolean; unit: string }>)
              .concat(isExec && ipsecActiveCount > 0 ? [{ v: String(ipsecActiveCount), l: 'USUARIOS VPN IPSEC', c: '#0891b2', d: null, lib: true, unit: '%' }] : [])
              .map((item, i) => (
                <View key={i} style={[s.coverKpiCard, { backgroundColor: `${item.c}0e`, borderLeftColor: item.c }]}>
                  <Text style={[s.coverKpiValue, { color: item.c }]}>{item.v}</Text>
                  {item.d != null && (
                    <Text style={{ fontSize: 6, color: trendClr(item.d, item.lib), marginTop: 1 }}>
                      {trendTxt(item.d, item.unit)} vs ant.
                    </Text>
                  )}
                  <Text style={s.coverKpiLabel}>{item.l}</Text>
                </View>
              ))}
          </View>

          {/* Period info */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 8, color: LGRAY }}>Período analizado</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: DARK, marginTop: 2 }}>
              {period.start} — {period.end}
            </Text>
            <Text style={{ fontSize: 7.5, color: LGRAY, marginTop: 2 }}>
              {period.days} {period.days === 1 ? 'día' : 'días'} · {formatNum(summary.total_events)} eventos procesados
            </Text>
          </View>

          {/* Risk level — executive only */}
          {exec && (
            <View style={[s.coverRiskBox, { backgroundColor: riskColor }]}>
              <Text style={s.coverRiskLabel}>Nivel de riesgo detectado</Text>
              <Text style={s.coverRiskValue}>{exec.risk_level}</Text>
            </View>
          )}
        </View>

        {/* Cover footer */}
        <View style={s.coverFooter}>
          <View style={s.coverDivider} />
          <View style={s.coverFooterRow}>
            <Text style={s.coverFooterTxt}>BC Fabric SAS</Text>
            <Text style={s.coverFooterTxt}>Generado: {now}</Text>
            <Text style={[s.coverConfid, { color: acc }]}>CONFIDENCIAL</Text>
          </View>
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════
          TABLA DE CONTENIDO
      ══════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.pageInner}>
          <PageHeader subtitle={`Período: ${period.start} — ${period.end}`} />

          <Text style={s.tocTitle}>Tabla de Contenido</Text>
          <Text style={s.tocSubtitle}>{orgName}</Text>

          {tocItems.map((item, i) => (
            <View key={i} style={s.tocItem}>
              <Text style={[s.tocNum, { color: `${acc}50` }]}>{item.num}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.tocLabel}>{item.label}</Text>
                <Text style={s.tocDesc}>{item.desc}</Text>
              </View>
              <Text style={[s.tocPage, { color: acc }]}>{item.page}</Text>
            </View>
          ))}

          <View style={{ marginTop: 24, padding: '10 12', backgroundColor: LIGHT, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: acc }}>
            <Text style={{ fontSize: 8, color: GRAY, lineHeight: 1.5 }}>
              Documento generado automáticamente por {logoText} · {now} · Confidencial — uso interno exclusivo
            </Text>
          </View>
        </View>
        <Footer />
      </Page>

      {/* ══════════════════════════════════════════════════════
          REPORTE EJECUTIVO — Páginas 3 y 4
      ══════════════════════════════════════════════════════ */}
      {isExec && (
        <>
          {/* Pg 3: KPIs + Resumen ejecutivo + Hallazgos */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <PageHeader subtitle={`Período: ${period.start} — ${period.end}`} />

              <View style={s.section}>
                <SectionTitle>{`Métricas del período (${period.days} ${period.days === 1 ? 'día' : 'días'})`}</SectionTitle>
                <View style={s.kpiGrid}>
                  {[
                    { v: formatNum(summary.total_events),   l: 'Eventos totales',             c: acc,  d: trends?.total_events_delta_pct ?? null, lib: true,  unit: '%' },
                    { v: `${summary.block_rate_pct}%`,      l: 'Tasa de bloqueo',             c: RED,  d: trends?.block_rate_delta_pts ?? null,   lib: false, unit: ' pts' },
                    { v: formatNum(summary.threat_events),  l: 'Amenazas detectadas',         c: AMBER,d: trends?.threats_delta_pct ?? null,      lib: true,  unit: '%' },
                    { v: String(severity_breakdown['critical'] ?? 0), l: 'Eventos críticos',  c: severity_breakdown['critical'] > 0 ? RED : GREEN, d: trends?.critical_delta_pct ?? null, lib: true, unit: '%' },
                    { v: formatBytes(summary.bytes_total),  l: 'Tráfico analizado',           c: DARK, d: null, lib: true, unit: '%' },
                    { v: String(summary.active_devices),    l: 'Dispositivos activos',        c: GREEN,d: null, lib: true, unit: '%' },
                  ].map((item, i) => (
                    <View key={i} style={[s.kpiBox, { backgroundColor: `${item.c}0e`, borderLeftColor: item.c }]}>
                      <Text style={[s.kpiValue, { color: item.c }]}>{item.v}</Text>
                      {item.d != null && (
                        <Text style={{ fontSize: 6, color: trendClr(item.d, item.lib), marginTop: 1 }}>
                          {trendTxt(item.d, item.unit)} vs período anterior
                        </Text>
                      )}
                      <Text style={s.kpiLabel}>{item.l}</Text>
                    </View>
                  ))}
                </View>

                {/* VPN activos + país de ataque */}
                {(ipsecActiveCount > 0 || topAttackCountry) && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {ipsecActiveCount > 0 && (
                      <View style={{ flex: 1, borderRadius: 4, padding: '8 12', backgroundColor: '#0891b210', borderLeftWidth: 3, borderLeftColor: '#0891b2' }}>
                        <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#0891b2' }}>{ipsecActiveCount}</Text>
                        <Text style={{ fontSize: 6.5, color: GRAY, marginTop: 3, letterSpacing: 0.3 }}>USUARIOS VPN IPSEC ACTIVOS AHORA</Text>
                      </View>
                    )}
                    {topAttackCountry && (
                      <View style={{ flex: 2, borderRadius: 4, padding: '8 12', backgroundColor: `${RED}10`, borderLeftWidth: 3, borderLeftColor: RED }}>
                        <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: RED }}>{topAttackCountry}</Text>
                        <Text style={{ fontSize: 6.5, color: GRAY, marginTop: 3, letterSpacing: 0.3 }}>PAÍS DE ORIGEN PRINCIPAL DE ATAQUES</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {exec && (
                <View style={s.section}>
                  <SectionTitle>Resumen Ejecutivo</SectionTitle>
                  <Text style={s.bodyText}>{exec.executive_summary}</Text>
                  <View style={[s.recBox, { borderLeftColor: acc, backgroundColor: `${acc}08` }]}>
                    <Text style={[s.recNumber, { color: acc }]}>Impacto al negocio</Text>
                    <Text style={s.recText}>{exec.business_impact}</Text>
                  </View>
                </View>
              )}

              {exec && exec.key_findings.length > 0 && (
                <View style={s.section}>
                  <SectionTitle>Hallazgos Clave</SectionTitle>
                  {exec.key_findings.map((f, i) => (
                    <View key={i} style={s.listItem}>
                      <Text style={[s.bullet, { color: acc }]}>→</Text>
                      <Text style={s.listText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Footer />
          </Page>

          {/* Pg 4: Recomendaciones + Firmas + Severidad */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <PageHeader subtitle="Recomendaciones estratégicas" />

              {exec && exec.recommendations.length > 0 && (
                <View style={s.section}>
                  <SectionTitle>Recomendaciones Estratégicas</SectionTitle>
                  {exec.recommendations.map((rec, i) => (
                    <View key={i} style={[s.recBox, { borderLeftColor: acc, backgroundColor: `${acc}08` }]}>
                      <Text style={[s.recNumber, { color: acc }]}>Recomendación {i + 1}</Text>
                      <Text style={s.recText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={s.section}>
                <SectionTitle>Distribución de Severidad</SectionTitle>
                {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
                  const count = severity_breakdown[sev] ?? 0
                  const pct = summary.total_events > 0 ? Math.round((count / summary.total_events) * 100) : 0
                  const color = sev === 'critical' ? RED : sev === 'high' ? AMBER : sev === 'medium' ? '#eab308' : acc
                  const labels: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo' }
                  return (
                    <View key={sev} style={s.sevRow}>
                      <Text style={[s.sevLabel, { color }]}>{labels[sev]}</Text>
                      <View style={s.sevBarBg}>
                        <View style={[s.sevBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                      <Text style={s.sevCount}>{formatNum(count)} ({pct}%)</Text>
                    </View>
                  )
                })}
              </View>

              <View style={[s.section, { marginTop: 16 }]}>
                <SectionTitle>Aprobación Ejecutiva</SectionTitle>
                {[{ role: 'Gerente General / CEO' }, { role: 'CISO / Director de Seguridad' }].map((signer, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>{signer.role}</Text>
                      <View style={{ height: 1, backgroundColor: LIGHT2, width: '80%' }} />
                      <Text style={{ fontSize: 7, color: LGRAY, marginTop: 3 }}>Nombre y firma</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>Fecha</Text>
                      <View style={{ height: 1, backgroundColor: LIGHT2, width: '60%' }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <Footer />
          </Page>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          REPORTE TÉCNICO
      ══════════════════════════════════════════════════════ */}
      {isTech && (
        <>
          {/* Pg 3: IPS / Intrusión — solo si hay datos */}
          {hasIntrusionContent ? (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle={`Seguridad · ${period.start} — ${period.end}`} />

                {intrusion_top && intrusion_top.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Top Ataques IPS / Intrusión (Bloqueados)</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Nombre del ataque</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Categoría</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Total</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueados</Text>
                      </View>
                      {intrusion_top.slice(0, 8).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>{row.name}</Text>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.category ?? '—'}</Text>
                          <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                          <Text style={[s.tCell, { flex: 1, color: GREEN }]}>{formatNum(row.blocked)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {intrusion_not_blocked && intrusion_not_blocked.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle color={RED}>Top Ataques Intrusión (NO Bloqueados)</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: RED }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Nombre del ataque</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Categoría</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Ocurrencias</Text>
                      </View>
                      {intrusion_not_blocked.slice(0, 6).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>{row.name}</Text>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.category ?? '—'}</Text>
                          <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {attack_src_ips && attack_src_ips.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>IPs Origen de Ataques</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Dirección IP</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Ataques</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueados</Text>
                      </View>
                      {attack_src_ips.slice(0, 8).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3, fontFamily: 'Courier' }]}>{row.ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                          <Text style={[s.tCell, { flex: 1, color: GREEN }]}>{formatNum(row.blocked)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {attack_src_countries && attack_src_countries.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Países Origen de Ataques</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>País</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Ataques</Text>
                      </View>
                      {attack_src_countries.slice(0, 8).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3 }]}>{row.country}</Text>
                          <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {users_hit_intrusion && users_hit_intrusion.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Usuarios Objeto de Intrusión</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                      </View>
                      {users_hit_intrusion.slice(0, 6).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: AMBER, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <Footer />
            </Page>
          ) : (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle={`Seguridad · ${period.start} — ${period.end}`} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${GREEN}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, color: GREEN }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 }}>Sin intrusiones detectadas</Text>
                  <Text style={{ fontSize: 9, color: GRAY, textAlign: 'center', maxWidth: 280 }}>
                    No se registraron ataques IPS ni intentos de intrusión en el período analizado.
                  </Text>
                </View>
              </View>
              <Footer />
            </Page>
          )}

          {/* Pg 4: Malware · Botnet · Phishing — solo si hay datos */}
          {hasMalwareContent ? (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="Malware · Botnet · Phishing" />

                {users_hit_malware && users_hit_malware.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle color="#ea580c">Malware — Usuarios Afectados</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: '#ea580c' }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                      </View>
                      {users_hit_malware.slice(0, 6).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: '#ea580c', fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {users_hit_adware && users_hit_adware.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle color={AMBER}>Adware — Usuarios Afectados</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: AMBER }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                      </View>
                      {users_hit_adware.slice(0, 6).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: AMBER, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {users_hit_spyware && users_hit_spyware.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle color="#9333ea">Spyware — Usuarios Afectados</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: '#9333ea' }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                      </View>
                      {users_hit_spyware.slice(0, 6).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: '#9333ea', fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {botnet_sources && botnet_sources.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle color="#7c3aed">Botnet / C2 — Fuentes Detectadas</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: '#7c3aed' }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>IP Origen</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Conexiones</Text>
                      </View>
                      {botnet_sources.slice(0, 6).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3, fontFamily: 'Courier' }]}>{row.src_ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: '#7c3aed', fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {phishing_users && phishing_users.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle color={RED}>Phishing / Fraude — Usuarios Expuestos</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: RED }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                      </View>
                      {phishing_users.slice(0, 6).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <Footer />
            </Page>
          ) : (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="Malware · Botnet · Phishing" />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${GREEN}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, color: GREEN }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 }}>Sin malware ni amenazas avanzadas</Text>
                  <Text style={{ fontSize: 9, color: GRAY, textAlign: 'center', maxWidth: 280 }}>
                    No se detectaron eventos de malware, botnet o phishing en el período analizado.
                  </Text>
                </View>
              </View>
              <Footer />
            </Page>
          )}

          {/* Pg 5: Aplicaciones */}
          {hasAppContent ? (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="Aplicaciones y Usuarios Proxy" />

                {top_apps_blocked && top_apps_blocked.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Aplicaciones Bloqueadas</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 3 }]}>Aplicación</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueos</Text>
                      </View>
                      {top_apps_blocked.slice(0, 8).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>{row.app}</Text>
                          <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {proxy_users && proxy_users.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Usuarios Proxy / Túnel</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Usuario / IP</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Sesiones</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Bytes</Text>
                      </View>
                      {proxy_users.slice(0, 8).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.user_or_ip}</Text>
                          <Text style={[s.tCell, { flex: 1, color: AMBER, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.sessions)}</Text>
                          <Text style={[s.tCell, { flex: 1 }]}>{formatBytes(row.bytes)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {top_apps_by_category && top_apps_by_category.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Top Aplicaciones por Categoría, Tecnología y Consumo</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Riesgo</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Aplicación</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Categoría</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Tecnología</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>BW</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Sesiones</Text>
                      </View>
                      {top_apps_by_category.slice(0, 10).map((row, i) => {
                        const rc = row.risk >= 5 ? RED : row.risk >= 4 ? AMBER : row.risk >= 3 ? '#eab308' : GREEN
                        const rl = row.risk >= 5 ? 'CRÍTICO' : row.risk >= 4 ? 'ALTO' : row.risk >= 3 ? 'MEDIO' : 'BAJO'
                        return (
                          <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                            <Text style={[s.tCell, { flex: 1, color: rc, fontFamily: 'Helvetica-Bold' }]}>{rl}</Text>
                            <Text style={[s.tCell, { flex: 2 }]}>{row.app}</Text>
                            <Text style={[s.tCell, { flex: 2 }]}>{row.category}</Text>
                            <Text style={[s.tCell, { flex: 2 }]}>{row.technology}</Text>
                            <Text style={[s.tCell, { flex: 1 }]}>{formatBytes(row.bandwidth)}</Text>
                            <Text style={[s.tCell, { flex: 1 }]}>{formatNum(row.sessions)}</Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                )}

                {top_users && top_users.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Top Usuarios por Ancho de Banda</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Usuario</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Bytes</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueados</Text>
                      </View>
                      {top_users.slice(0, 8).map((u, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 2 }]}>{u.user}</Text>
                          <Text style={[s.tCell, { flex: 1 }]}>{formatNum(u.events)}</Text>
                          <Text style={[s.tCell, { flex: 1 }]}>{formatBytes(u.bytes)}</Text>
                          <Text style={[s.tCell, { flex: 1, color: u.blocked > 0 ? RED : GREEN, fontFamily: 'Helvetica-Bold' }]}>{u.blocked}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <Footer />
            </Page>
          ) : (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="Aplicaciones y Usuarios Proxy" />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 }}>Sin datos de aplicaciones</Text>
                  <Text style={{ fontSize: 9, color: GRAY, textAlign: 'center', maxWidth: 280 }}>No hay registros de aplicaciones en el período analizado.</Text>
                </View>
              </View>
              <Footer />
            </Page>
          )}

          {/* Pg 6: VPN + Logins fallidos + Historial */}
          {hasVpnContent ? (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="VPN e Historial de Sesiones" />

                {vpn_ssl_users && vpn_ssl_users.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>VPN SSL — Usuarios Activos</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Usuario</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>IP</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Primer uso</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Enviados</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Recibidos</Text>
                      </View>
                      {vpn_ssl_users.slice(0, 10).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.user}</Text>
                          <Text style={[s.tCell, { flex: 2, fontFamily: 'Courier' }]}>{row.ip}</Text>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.first_used ? new Date(row.first_used).toLocaleDateString('es-CO') : '—'}</Text>
                          <Text style={[s.tCell, { flex: 1 }]}>{formatBytes(row.bytes_sent)}</Text>
                          <Text style={[s.tCell, { flex: 1 }]}>{formatBytes(row.bytes_received)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {vpn_failed_logins && vpn_failed_logins.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle color={RED}>Logins Fallidos VPN</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: RED }]}>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Usuario</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Tipo</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Intentos</Text>
                      </View>
                      {vpn_failed_logins.slice(0, 8).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.user}</Text>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.type}</Text>
                          <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {session_history && session_history.length > 0 && (
                  <View style={s.section}>
                    <SectionTitle>Historial de Tráfico por Sesiones</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Fecha</Text>
                        <Text style={[s.tHeadText, { flex: 1 }]}>Sesiones</Text>
                      </View>
                      {session_history.slice(0, 15).map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.date}</Text>
                          <Text style={[s.tCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.sessions)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <Footer />
            </Page>
          ) : (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="VPN e Historial de Sesiones" />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 }}>Sin actividad VPN</Text>
                  <Text style={{ fontSize: 9, color: GRAY, textAlign: 'center', maxWidth: 280 }}>No se registraron sesiones VPN en el período analizado.</Text>
                </View>
              </View>
              <Footer />
            </Page>
          )}

          {/* Pg 7: Estadísticas + Recomendaciones técnicas */}
          {hasTrafficContent && (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="Estadísticas y Recomendaciones" />

                {traffic_stats && (
                  <View style={s.section}>
                    <SectionTitle>Estadísticas de Tráfico</SectionTitle>
                    <View style={s.table}>
                      <View style={[s.tHead, { backgroundColor: acc }]}>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Métrica</Text>
                        <Text style={[s.tHeadText, { flex: 2 }]}>Valor</Text>
                      </View>
                      {[
                        { label: 'Total usuarios',            value: formatNum(traffic_stats.total_users) },
                        { label: 'Total aplicaciones',        value: formatNum(traffic_stats.total_apps) },
                        { label: 'Total sesiones',            value: formatNum(traffic_stats.total_sessions) },
                        { label: 'Fecha más activa',          value: traffic_stats.most_active_date ?? '—' },
                        { label: 'Bytes totales',             value: formatBytes(traffic_stats.bytes_total) },
                        { label: 'Destinos únicos',           value: formatNum(traffic_stats.total_destinations) },
                        { label: 'Promedio sesiones/día',     value: formatNum(traffic_stats.avg_sessions_per_day) },
                        { label: 'Promedio bytes/día',        value: formatBytes(traffic_stats.avg_bytes_per_day) },
                      ].map((row, i) => (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{row.label}</Text>
                          <Text style={[s.tCell, { flex: 2 }]}>{row.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {tech && (
                  <>
                    <View style={s.section}>
                      <SectionTitle>Comentarios y Análisis</SectionTitle>
                      <Text style={s.bodyText}>{tech.threat_analysis}</Text>
                      {tech.technical_findings.length > 0 && tech.technical_findings.map((f, i) => (
                        <View key={i} style={s.listItem}>
                          <Text style={[s.bullet, { color: acc }]}>▸</Text>
                          <Text style={s.listText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={s.section}>
                      <SectionTitle>Acciones Técnicas Recomendadas</SectionTitle>
                      {tech.recommendations.map((rec, i) => (
                        <View key={i} style={[s.recBox, { borderLeftColor: acc, backgroundColor: `${acc}08` }]}>
                          <Text style={[s.recNumber, { color: acc }]}>Acción {i + 1}</Text>
                          <Text style={s.recText}>{rec}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <View style={[s.section, { marginTop: 12 }]}>
                  <SectionTitle>Revisión y Aprobación Técnica</SectionTitle>
                  {[{ role: 'Ingeniero de Seguridad responsable' }, { role: 'CISO / Jefe de Infraestructura' }].map((signer, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                      <View style={{ flex: 2 }}>
                        <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>{signer.role}</Text>
                        <View style={{ height: 1, backgroundColor: LIGHT2, width: '80%' }} />
                        <Text style={{ fontSize: 7, color: LGRAY, marginTop: 3 }}>Nombre y firma</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>Fecha</Text>
                        <View style={{ height: 1, backgroundColor: LIGHT2, width: '60%' }} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              <Footer />
            </Page>
          )}

          {/* Apéndice A — Dispositivos */}
          {metrics.devices.length > 0 && (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="Apéndice A — Inventario de dispositivos" />
                <View style={s.section}>
                  <SectionTitle>Apéndice A — Dispositivos Monitoreados</SectionTitle>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Dispositivo</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Marca</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Amenazas</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Última actividad</Text>
                    </View>
                    {metrics.devices.map((d, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{d.name}</Text>
                        <Text style={[s.tCell, { flex: 1 }]}>{d.brand}</Text>
                        <Text style={[s.tCell, { flex: 1 }]}>{formatNum(d.events)}</Text>
                        <Text style={[s.tCell, { flex: 1, color: d.threats > 0 ? RED : GREEN, fontFamily: 'Helvetica-Bold' }]}>{d.threats}</Text>
                        <Text style={[s.tCell, { flex: 2 }]}>{d.last_seen ? new Date(d.last_seen).toLocaleDateString('es-CO') : 'N/D'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <Footer />
            </Page>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          REPORTE DE CUMPLIMIENTO
      ══════════════════════════════════════════════════════ */}
      {isComp && (
        <>
          {/* Pg 3: Resumen + Métricas */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <PageHeader subtitle={`Resumen de cumplimiento · ${period.start} — ${period.end}`} />

              {comp && (
                <View style={s.section}>
                  <SectionTitle>Resumen de Cumplimiento</SectionTitle>
                  <Text style={s.bodyText}>{comp.compliance_summary}</Text>
                </View>
              )}

              <View style={s.section}>
                <SectionTitle>Evidencia de Auditoría — Métricas del Período</SectionTitle>
                <View style={s.kpiGrid}>
                  {[
                    { v: formatNum(summary.total_events),   l: 'Eventos registrados',          c: acc },
                    { v: formatNum(summary.blocked_events), l: `Accesos bloqueados (${summary.block_rate_pct}%)`, c: RED },
                    { v: formatNum(summary.threat_events),  l: 'Incidentes de seguridad',       c: AMBER },
                    { v: String(severity_breakdown['critical'] ?? 0), l: 'Eventos críticos',   c: severity_breakdown['critical'] > 0 ? RED : GREEN },
                    { v: String(summary.active_devices),    l: 'Activos monitoreados',          c: GREEN },
                    { v: `${period.days} días`,             l: 'Cobertura de logs',             c: DARK },
                  ].map((item, i) => (
                    <View key={i} style={[s.kpiBox, { backgroundColor: `${item.c}0e`, borderLeftColor: item.c }]}>
                      <Text style={[s.kpiValue, { color: item.c, fontSize: 15 }]}>{item.v}</Text>
                      <Text style={s.kpiLabel}>{item.l}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {comp && (
                <View style={s.section}>
                  <SectionTitle>Estado de Retención de Datos</SectionTitle>
                  <View style={[s.recBox, { borderLeftColor: acc, backgroundColor: `${acc}08` }]}>
                    <Text style={s.recText}>{comp.data_retention_status}</Text>
                  </View>
                </View>
              )}
            </View>
            <Footer />
          </Page>

          {/* Pg 4: Hallazgos de auditoría */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <PageHeader subtitle="Hallazgos de auditoría" />

              {comp && comp.audit_findings.length > 0 && (
                <View style={s.section}>
                  <SectionTitle>Hallazgos de Auditoría — Evaluación de Controles</SectionTitle>
                  {comp.audit_findings.map((f, i) => {
                    const { status, color } = parseAuditStatus(f)
                    return (
                      <View key={i} style={[s.auditRow, { borderColor: `${color}40`, backgroundColor: `${color}08` }]}>
                        <View style={[s.auditBadge, { backgroundColor: color }]}>
                          <Text style={s.auditBadgeText}>{status}</Text>
                        </View>
                        <Text style={s.auditText}>{f}</Text>
                      </View>
                    )
                  })}
                </View>
              )}

              {comp && comp.regulatory_gaps.length > 0 && (
                <View style={s.section}>
                  <SectionTitle color={RED}>Brechas Regulatorias Identificadas</SectionTitle>
                  {comp.regulatory_gaps.map((gap, i) => (
                    <View key={i} style={[s.auditRow, { borderColor: `${RED}40`, backgroundColor: '#fff1f2' }]}>
                      <View style={[s.auditBadge, { backgroundColor: RED }]}>
                        <Text style={s.auditBadgeText}>BRECHA {i + 1}</Text>
                      </View>
                      <Text style={s.auditText}>{gap}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Footer />
          </Page>

          {/* Pg 5: Evidencia + Plan de remediación + Firmas */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <PageHeader subtitle="Plan de remediación" />

              {top_blocked_ips.length > 0 && (
                <View style={s.section}>
                  <SectionTitle>Registro de Accesos Bloqueados (Evidencia Forense)</SectionTitle>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Dirección IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueos</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Estado de control</Text>
                    </View>
                    {top_blocked_ips.slice(0, 6).map((ip, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3, fontFamily: 'Courier' }]}>{ip.ip}</Text>
                        <Text style={[s.tCell, { flex: 1, fontFamily: 'Helvetica-Bold', color: acc }]}>{formatNum(ip.count)}</Text>
                        <Text style={[s.tCell, { flex: 2, color: GREEN }]}>Control activo — bloqueado</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {comp && (
                <View style={s.section}>
                  <SectionTitle>Plan de Remediación</SectionTitle>
                  <View style={[s.recBox, { borderLeftColor: acc, backgroundColor: `${acc}08` }]}>
                    <Text style={[s.recNumber, { color: acc }]}>Línea de tiempo de remediación</Text>
                    <Text style={s.recText}>{comp.remediation_timeline}</Text>
                  </View>
                </View>
              )}

              <View style={[s.section, { marginTop: 20 }]}>
                <SectionTitle>Sección de Firma y Aprobación</SectionTitle>
                {[
                  { role: 'CISO / Responsable de Seguridad' },
                  { role: 'Oficial de Cumplimiento' },
                  { role: 'Auditor / Revisor' },
                ].map((signer, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>{signer.role}</Text>
                      <View style={{ height: 1, backgroundColor: LIGHT2, width: '80%' }} />
                      <Text style={{ fontSize: 7, color: LGRAY, marginTop: 3 }}>Nombre y firma</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>Fecha</Text>
                      <View style={{ height: 1, backgroundColor: LIGHT2, width: '60%' }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <Footer />
          </Page>

          {/* Apéndice — Dispositivos */}
          {metrics.devices.length > 0 && (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <PageHeader subtitle="Apéndice — Activos monitoreados" />
                <View style={s.section}>
                  <SectionTitle>Apéndice A — Inventario de Activos Auditados</SectionTitle>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Dispositivo</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Marca</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Amenazas</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Última actividad</Text>
                    </View>
                    {metrics.devices.map((d, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{d.name}</Text>
                        <Text style={[s.tCell, { flex: 1 }]}>{d.brand}</Text>
                        <Text style={[s.tCell, { flex: 1 }]}>{formatNum(d.events)}</Text>
                        <Text style={[s.tCell, { flex: 1, color: d.threats > 0 ? RED : GREEN, fontFamily: 'Helvetica-Bold' }]}>{d.threats}</Text>
                        <Text style={[s.tCell, { flex: 2 }]}>{d.last_seen ? new Date(d.last_seen).toLocaleDateString('es-CO') : 'N/D'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <Footer />
            </Page>
          )}
        </>
      )}

    </Document>
  )
}
