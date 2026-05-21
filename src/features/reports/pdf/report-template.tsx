import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportMetrics } from '../services/metrics-aggregator'
import type { GeneratedReport, ExecutiveReport, TechnicalReport, ComplianceReport } from '../services/claude-report.service'

// Base colors
const DARK   = '#0f172a'
const GRAY   = '#475569'
const LIGHT  = '#f1f5f9'
const RED    = '#dc2626'
const GREEN  = '#16a34a'
const AMBER  = '#d97706'
const WHITE  = '#ffffff'

// Accent per report type
const ACCENT: Record<string, string> = {
  executive:  '#1d4ed8',  // blue
  technical:  '#7c3aed',  // purple
  compliance: '#0f766e',  // teal
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

const s = StyleSheet.create({
  // Page
  page:           { fontFamily: 'Helvetica', fontSize: 9, color: DARK, backgroundColor: WHITE },
  pageInner:      { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48 },
  // Cover
  coverBand:      { height: 260, paddingHorizontal: 48, paddingTop: 52, paddingBottom: 32, justifyContent: 'space-between' },
  coverBody:      { flex: 1, paddingHorizontal: 48, paddingTop: 44 },
  coverFooter:    { paddingHorizontal: 48, paddingBottom: 36 },
  coverDivider:   { height: 1, backgroundColor: '#e2e8f0', marginBottom: 16 },
  coverFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  coverLogo:      { fontSize: 34, fontFamily: 'Helvetica-Bold', color: WHITE },
  coverSubtitle:  { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  coverBadge:     { marginTop: 24, borderRadius: 4, paddingVertical: 5, paddingHorizontal: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)' },
  coverBadgeText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 1.5 },
  coverOrgName:   { fontSize: 26, fontFamily: 'Helvetica-Bold', color: DARK },
  coverTypeLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 16 },
  coverMeta:      { marginTop: 28, gap: 14 },
  coverMetaLabel: { fontSize: 8, color: GRAY, marginBottom: 2 },
  coverMetaValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: DARK },
  coverFooterText:{ fontSize: 8, color: GRAY },
  coverConfidential: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Inner page header
  pageHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 12, borderBottomWidth: 1.5 },
  pageHeaderLogo: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  pageHeaderMeta: { fontSize: 8, color: GRAY, textAlign: 'right' },
  // Section
  section:        { marginBottom: 20 },
  sectionTitle:   { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: LIGHT },
  bodyText:       { fontSize: 9, lineHeight: 1.55, color: DARK, marginBottom: 6 },
  // KPI grid
  kpiGrid:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  kpiBox:         { borderRadius: 4, padding: 10, flex: 1, minWidth: '28%' },
  kpiValue:       { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK },
  kpiLabel:       { fontSize: 7, color: GRAY, marginTop: 2 },
  // Risk level badge
  riskBox:        { borderRadius: 6, padding: '10 16', alignSelf: 'flex-start', marginBottom: 12 },
  riskLabel:      { fontSize: 9, color: GRAY, marginBottom: 3 },
  riskValue:      { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE },
  // List items
  listItem:       { flexDirection: 'row', marginBottom: 5 },
  bullet:         { width: 14, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  listText:       { flex: 1, fontSize: 9, lineHeight: 1.45, color: DARK },
  // Recommendation box
  recBox:         { borderLeftWidth: 3, padding: 8, marginBottom: 7, borderRadius: 2, backgroundColor: LIGHT },
  recNumber:      { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  recText:        { fontSize: 9, color: DARK, lineHeight: 1.4 },
  // Table
  table:          { width: '100%', marginTop: 4 },
  tHead:          { flexDirection: 'row', padding: 5, borderRadius: 2 },
  tHeadText:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE, flex: 1 },
  tRow:           { flexDirection: 'row', padding: 5, borderBottomWidth: 1, borderBottomColor: LIGHT },
  tRowAlt:        { flexDirection: 'row', padding: 5, backgroundColor: LIGHT, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tCell:          { fontSize: 8, color: DARK, flex: 1 },
  // ToC
  tocTitle:       { fontSize: 22, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 },
  tocSubtitle:    { fontSize: 10, color: GRAY, marginBottom: 28 },
  tocItem:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: LIGHT },
  tocNum:         { fontSize: 9, color: GRAY, width: 28 },
  tocLabel:       { fontSize: 10, color: DARK, flex: 1 },
  tocDesc:        { fontSize: 8, color: GRAY, marginTop: 2 },
  tocPage:        { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, width: 24, textAlign: 'right' },
  // Severity bar
  sevRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  sevLabel:       { width: 60, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  sevBarBg:       { flex: 1, backgroundColor: LIGHT, height: 8, borderRadius: 4, marginHorizontal: 8 },
  sevBarFill:     { height: 8, borderRadius: 4 },
  sevCount:       { width: 70, fontSize: 8, textAlign: 'right', color: GRAY },
  // Audit finding
  auditRow:       { flexDirection: 'row', marginBottom: 7, padding: 8, borderRadius: 3, borderWidth: 1 },
  auditBadge:     { borderRadius: 3, paddingVertical: 2, paddingHorizontal: 5, alignSelf: 'flex-start', marginRight: 10, minWidth: 72, alignItems: 'center' },
  auditBadgeText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: WHITE },
  auditText:      { flex: 1, fontSize: 8, lineHeight: 1.4, color: DARK },
  // Footer
  footer:         { position: 'absolute', bottom: 22, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: LIGHT, paddingTop: 7 },
  footerText:     { fontSize: 7, color: GRAY },
})

function formatNum(n: number) { return n.toLocaleString('es-CO') }
function formatBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
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
}

export function ReportPDF({ metrics, narrative, reportType, brandName, brandColor }: Props) {
  const { summary, period, organization, top_threats, top_blocked_ips, top_users, severity_breakdown, top_protocols,
    intrusion_top, intrusion_not_blocked, attack_src_ips, attack_src_countries, users_hit_intrusion,
    users_hit_malware, users_hit_adware, users_hit_spyware, botnet_sources, phishing_users,
    top_apps_blocked, proxy_users, top_apps_by_category, vpn_ssl_users, vpn_failed_logins,
    session_history, traffic_stats,
  } = metrics
  const acc = brandColor ?? ACCENT[reportType] ?? ACCENT.executive
  const logoText = brandName ?? '{logoText}'
  const now = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const isExec = reportType === 'executive'
  const isTech = reportType === 'technical'
  const isComp = reportType === 'compliance'
  const exec = isExec && narrative ? narrative as ExecutiveReport : null
  const tech = isTech && narrative ? narrative as TechnicalReport : null
  const comp = isComp && narrative ? narrative as ComplianceReport : null

  const riskColors: Record<string, string> = { BAJO: GREEN, MEDIO: AMBER, ALTO: RED, CRÍTICO: RED }
  const riskColor = exec ? (riskColors[exec.risk_level] ?? GRAY) : acc

  const FooterEl = ({ label }: { label?: string }) => (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{logoText} · {organization.name} · {TYPE_LABELS[reportType] ?? ''} · Confidencial</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  )

  return (
    <Document title={`${TYPE_LABELS[reportType]} — ${organization.name}`} author="{logoText}">

      {/* ═══════════════════════════════════════════════════════
          PORTADA
      ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {/* Colored band */}
        <View style={[s.coverBand, { backgroundColor: acc }]}>
          <View>
            <Text style={s.coverLogo}>{logoText}</Text>
            <Text style={s.coverSubtitle}>Firewall Analytics Platform · BC Fabric SAS</Text>
          </View>
          <View style={s.coverBadge}>
            <Text style={s.coverBadgeText}>{TYPE_LABELS[reportType] ?? 'REPORTE'}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={s.coverBody}>
          <Text style={s.coverOrgName}>{organization.name}</Text>
          <View style={{ width: 40, height: 3, backgroundColor: acc, marginTop: 10, marginBottom: 4 }} />
          <Text style={[s.coverTypeLabel, { color: acc }]}>{TYPE_SUBTITLES[reportType] ?? ''}</Text>

          <View style={s.coverMeta}>
            <View>
              <Text style={s.coverMetaLabel}>Período analizado</Text>
              <Text style={s.coverMetaValue}>{period.start} — {period.end}</Text>
              <Text style={[s.coverMetaLabel, { marginTop: 2 }]}>{period.days} días · {formatNum(summary.total_events)} eventos procesados</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 32, marginTop: 8 }}>
              <View>
                <Text style={s.coverMetaLabel}>Dispositivos activos</Text>
                <Text style={[s.coverMetaValue, { fontSize: 20 }]}>{summary.active_devices}</Text>
              </View>
              <View>
                <Text style={s.coverMetaLabel}>Tráfico analizado</Text>
                <Text style={[s.coverMetaValue, { fontSize: 20 }]}>{formatBytes(summary.bytes_total)}</Text>
              </View>
              <View>
                <Text style={s.coverMetaLabel}>Tasa de bloqueo</Text>
                <Text style={[s.coverMetaValue, { fontSize: 20, color: acc }]}>{summary.block_rate_pct}%</Text>
              </View>
            </View>

            {/* Risk level on executive cover */}
            {exec && (
              <View style={[s.riskBox, { backgroundColor: riskColor }]}>
                <Text style={s.riskLabel}>Nivel de riesgo detectado</Text>
                <Text style={s.riskValue}>{exec.risk_level}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={s.coverFooter}>
          <View style={s.coverDivider} />
          <View style={s.coverFooterRow}>
            <Text style={s.coverFooterText}>BC Fabric SAS</Text>
            <Text style={s.coverFooterText}>Generado: {now}</Text>
            <Text style={[s.coverConfidential, { color: acc }]}>CONFIDENCIAL</Text>
          </View>
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          TABLA DE CONTENIDO — Pg 2
      ═══════════════════════════════════════════════════════ */}
      {(() => {
        const tocItems = isExec ? [
          { num: '01', label: 'Portada', desc: 'Identificación del reporte y período', page: 1 },
          { num: '02', label: 'Tabla de Contenido', desc: 'Índice del documento', page: 2 },
          { num: '03', label: 'Métricas del Período', desc: 'KPIs ejecutivos, resumen e impacto al negocio', page: 3 },
          { num: '04', label: 'Recomendaciones Estratégicas', desc: 'Acciones prioritarias y distribución de severidad', page: 4 },
        ] : isTech ? [
          { num: '01', label: 'Portada', desc: 'Identificación del reporte y período', page: 1 },
          { num: '02', label: 'Tabla de Contenido', desc: 'Índice del documento', page: 2 },
          { num: '03', label: 'Métricas Operacionales', desc: 'Contadores, severidad y protocolos', page: 3 },
          { num: '04', label: 'Análisis de Amenazas e IPs', desc: 'Top amenazas, IPs bloqueadas y análisis IA', page: 4 },
          { num: '05', label: 'Usuarios y Recomendaciones', desc: 'Actividad de usuarios y acciones técnicas', page: 5 },
          { num: '06', label: 'Apéndice — Dispositivos', desc: 'Inventario de sensores activos', page: 6 },
        ] : [
          { num: '01', label: 'Portada', desc: 'Identificación del reporte y período', page: 1 },
          { num: '02', label: 'Tabla de Contenido', desc: 'Índice del documento', page: 2 },
          { num: '03', label: 'Resumen de Cumplimiento', desc: 'Estado normativo y métricas de auditoría', page: 3 },
          { num: '04', label: 'Hallazgos de Auditoría', desc: 'Evaluación de controles y brechas regulatorias', page: 4 },
          { num: '05', label: 'Plan de Remediación y Firmas', desc: 'Evidencia forense, remediación y aprobación', page: 5 },
          { num: '06', label: 'Apéndice — Dispositivos', desc: 'Inventario de activos monitoreados', page: 6 },
        ]
        return (
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}</Text>
              </View>
              <Text style={s.tocTitle}>Tabla de Contenido</Text>
              <Text style={s.tocSubtitle}>{organization.name} · Período: {period.start} — {period.end}</Text>
              {tocItems.map((item, i) => (
                <View key={i} style={s.tocItem}>
                  <Text style={[s.tocNum, { color: acc }]}>{item.num}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.tocLabel, { fontFamily: 'Helvetica-Bold' }]}>{item.label}</Text>
                    <Text style={s.tocDesc}>{item.desc}</Text>
                  </View>
                  <View style={{ width: 1, height: 8, backgroundColor: '#e2e8f0', marginHorizontal: 8 }} />
                  <Text style={[s.tocPage, { color: acc }]}>{item.page}</Text>
                </View>
              ))}
              <View style={{ marginTop: 20, padding: 12, backgroundColor: LIGHT, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: acc }}>
                <Text style={{ fontSize: 8, color: GRAY }}>Documento generado automáticamente por {logoText} · {now} · Confidencial — uso interno</Text>
              </View>
            </View>
            <FooterEl />
          </Page>
        )
      })()}

      {/* ═══════════════════════════════════════════════════════
          REPORTE EJECUTIVO — Pgs 3 y 4
      ═══════════════════════════════════════════════════════ */}
      {isExec && (
        <>
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Período: {period.start} — {period.end}</Text>
              </View>

              {/* KPIs */}
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Métricas del período ({period.days} días)</Text>
                <View style={s.kpiGrid}>
                  {[
                    { v: formatNum(summary.total_events), l: 'Eventos totales', c: DARK },
                    { v: formatNum(summary.blocked_events), l: `Bloqueados (${summary.block_rate_pct}%)`, c: RED },
                    { v: formatNum(summary.threat_events), l: 'Amenazas detectadas', c: AMBER },
                    { v: String(severity_breakdown['critical'] ?? 0), l: 'Eventos críticos', c: severity_breakdown['critical'] > 0 ? RED : GREEN },
                    { v: formatBytes(summary.bytes_total), l: 'Tráfico analizado', c: DARK },
                    { v: String(summary.active_devices), l: 'Dispositivos activos', c: GREEN },
                  ].map((item, i) => (
                    <View key={i} style={[s.kpiBox, { backgroundColor: LIGHT }]}>
                      <Text style={[s.kpiValue, { color: item.c }]}>{item.v}</Text>
                      <Text style={s.kpiLabel}>{item.l}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Executive summary */}
              {exec && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Resumen Ejecutivo</Text>
                  <Text style={s.bodyText}>{exec.executive_summary}</Text>
                  <View style={[s.recBox, { borderLeftColor: acc }]}>
                    <Text style={[s.recNumber, { color: acc }]}>Impacto al negocio</Text>
                    <Text style={s.recText}>{exec.business_impact}</Text>
                  </View>
                </View>
              )}

              {/* Key findings */}
              {exec && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Hallazgos Clave</Text>
                  {exec.key_findings.map((f, i) => (
                    <View key={i} style={s.listItem}>
                      <Text style={[s.bullet, { color: acc }]}>→</Text>
                      <Text style={s.listText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <FooterEl />
          </Page>

          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Recomendaciones estratégicas</Text>
              </View>

              {exec && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Recomendaciones Estratégicas</Text>
                  {exec.recommendations.map((rec, i) => (
                    <View key={i} style={[s.recBox, { borderLeftColor: acc }]}>
                      <Text style={[s.recNumber, { color: acc }]}>Recomendación {i + 1}</Text>
                      <Text style={s.recText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sign-off */}
              <View style={[s.section, { marginTop: 16 }]}>
                <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Aprobación Ejecutiva</Text>
                {[{ role: 'Gerente General / CEO', blank: true }, { role: 'CISO / Director de Seguridad', blank: true }].map((signer, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 14 }}>{signer.role}</Text>
                      <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '80%' }} />
                      <Text style={{ fontSize: 7, color: GRAY, marginTop: 3 }}>Nombre y firma</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 14 }}>Fecha</Text>
                      <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '60%' }} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Severity overview — simplified, no raw data */}
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Distribución de Severidad</Text>
                {(['critical','high','medium','low'] as const).map(sev => {
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
            </View>
            <FooterEl />
          </Page>
        </>
      )}


      {/* ═══════════════════════════════════════════════════════
          REPORTE TÉCNICO — Estilo FortiAnalyzer (6 páginas)
      ═══════════════════════════════════════════════════════ */}
      {isTech && (
        <>
          {/* Pg 2: IPS/Intrusión */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Seguridad · {period.start} — {period.end}</Text>
              </View>

              {/* Top Ataques Intrusión Bloqueados */}
              {intrusion_top && intrusion_top.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Top Ataques Intrusión (Bloqueados)</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Nombre del ataque</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Categoría</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Total</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueados</Text>
                    </View>
                    {(intrusion_top ?? []).slice(0, 8).map((row, i) => (
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

              {/* Top Ataques Intrusión NO Bloqueados */}
              {intrusion_not_blocked && intrusion_not_blocked.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: RED, borderBottomColor: `${RED}30` }]}>Top Ataques Intrusión (NO Bloqueados)</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: RED }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Nombre del ataque</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Categoría</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Ocurrencias</Text>
                    </View>
                    {(intrusion_not_blocked ?? []).slice(0, 6).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>{row.name}</Text>
                        <Text style={[s.tCell, { flex: 2 }]}>{row.category ?? '—'}</Text>
                        <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* IPs origen ataques */}
              {attack_src_ips && attack_src_ips.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>IPs Origen de Ataques</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Dirección IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Ataques</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueados</Text>
                    </View>
                    {(attack_src_ips ?? []).slice(0, 8).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3, fontFamily: 'Courier' }]}>{row.ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                        <Text style={[s.tCell, { flex: 1, color: GREEN }]}>{formatNum(row.blocked)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Países origen */}
              {attack_src_countries && attack_src_countries.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Países Origen de Ataques</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>País</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Ataques</Text>
                    </View>
                    {(attack_src_countries ?? []).slice(0, 8).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3 }]}>{row.country}</Text>
                        <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Usuarios objeto de Intrusión */}
              {users_hit_intrusion && users_hit_intrusion.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Usuarios Objeto de Intrusión</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                    </View>
                    {(users_hit_intrusion ?? []).slice(0, 6).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: AMBER, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
            <FooterEl />
          </Page>

          {/* Pg 3: Malware / Adware / Spyware / Botnet / Phishing */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Malware, Botnet y Phishing</Text>
              </View>

              {/* Malware */}
              {users_hit_malware && users_hit_malware.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: '#ea580c', borderBottomColor: '#ea580c30' }]}>Malware — Usuarios Afectados</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: '#ea580c' }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                    </View>
                    {(users_hit_malware ?? []).slice(0, 6).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: '#ea580c', fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Adware */}
              {users_hit_adware && users_hit_adware.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: AMBER, borderBottomColor: `${AMBER}30` }]}>Adware — Usuarios Afectados</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: AMBER }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                    </View>
                    {(users_hit_adware ?? []).slice(0, 6).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: AMBER, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Spyware */}
              {users_hit_spyware && users_hit_spyware.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: '#9333ea', borderBottomColor: '#9333ea30' }]}>Spyware — Usuarios Afectados</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: '#9333ea' }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                    </View>
                    {(users_hit_spyware ?? []).slice(0, 6).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: '#9333ea', fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Botnet */}
              {botnet_sources && botnet_sources.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: '#7c3aed', borderBottomColor: '#7c3aed30' }]}>Botnet / C2 — Fuentes detectadas</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: '#7c3aed' }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>IP Origen</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Conexiones</Text>
                    </View>
                    {(botnet_sources ?? []).slice(0, 6).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3, fontFamily: 'Courier' }]}>{row.src_ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: '#7c3aed', fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Phishing */}
              {phishing_users && phishing_users.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: '#dc2626', borderBottomColor: '#dc262630' }]}>Phishing / Fraude — Usuarios expuestos</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: '#dc2626' }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Usuario / IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Eventos</Text>
                    </View>
                    {(phishing_users ?? []).slice(0, 6).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3 }]}>{row.user_or_ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
            <FooterEl />
          </Page>

          {/* Pg 4: Aplicaciones */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Aplicaciones y Usuarios Proxy</Text>
              </View>

              {/* Apps bloqueadas */}
              {top_apps_blocked && top_apps_blocked.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Aplicaciones Bloqueadas</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 3 }]}>Aplicación</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Bloqueos</Text>
                    </View>
                    {(top_apps_blocked ?? []).slice(0, 8).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>{row.app}</Text>
                        <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Proxy users */}
              {proxy_users && proxy_users.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Usuarios Proxy / Túnel</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Usuario / IP</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Sesiones</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Bytes</Text>
                    </View>
                    {(proxy_users ?? []).slice(0, 8).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 2 }]}>{row.user_or_ip}</Text>
                        <Text style={[s.tCell, { flex: 1, color: AMBER, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.sessions)}</Text>
                        <Text style={[s.tCell, { flex: 1 }]}>{formatBytes(row.bytes)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Top apps por Categoría / Tecnología / BW / Sesiones */}
              {top_apps_by_category && top_apps_by_category.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Top Aplicaciones por Categoría, Tecnología, Ancho de Banda y Sesiones</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Riesgo</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Aplicación</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Categoría</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Tecnología</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>BW</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Sesiones</Text>
                    </View>
                    {(top_apps_by_category ?? []).slice(0, 10).map((row, i) => {
                      const riskColor = row.risk >= 5 ? RED : row.risk >= 4 ? AMBER : row.risk >= 3 ? '#eab308' : GREEN
                      const riskLabel = row.risk >= 5 ? 'critical' : row.risk >= 4 ? 'high' : row.risk >= 3 ? 'medium' : 'low'
                      return (
                        <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                          <Text style={[s.tCell, { flex: 1, color: riskColor, fontFamily: 'Helvetica-Bold' }]}>{riskLabel}</Text>
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

              {/* Top usuarios por ancho de banda */}
              {top_users && top_users.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Top Usuarios por Ancho de Banda</Text>
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
            <FooterEl />
          </Page>

          {/* Pg 5: VPN + Logins fallidos + Historial tráfico */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}VPN e Historial de Sesiones</Text>
              </View>

              {/* VPN SSL usuarios */}
              {vpn_ssl_users && vpn_ssl_users.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>VPN SSL — Usuarios Activos</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Usuario</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>IP</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Primer uso</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Bytes Enviados</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Bytes Recibidos</Text>
                    </View>
                    {(vpn_ssl_users ?? []).slice(0, 10).map((row, i) => (
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

              {/* Logins fallidos VPN */}
              {vpn_failed_logins && vpn_failed_logins.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: RED, borderBottomColor: `${RED}30` }]}>Logins Fallidos VPN</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: RED }]}>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Usuario</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Tipo</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Intentos</Text>
                    </View>
                    {(vpn_failed_logins ?? []).slice(0, 8).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 2 }]}>{row.user}</Text>
                        <Text style={[s.tCell, { flex: 2 }]}>{row.type}</Text>
                        <Text style={[s.tCell, { flex: 1, color: RED, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.count)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Historial de tráfico por sesiones */}
              {session_history && session_history.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Historial de Tráfico por Sesiones</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Fecha</Text>
                      <Text style={[s.tHeadText, { flex: 1 }]}>Sesiones</Text>
                    </View>
                    {(session_history ?? []).slice(0, 15).map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 2 }]}>{row.date}</Text>
                        <Text style={[s.tCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{formatNum(row.sessions)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
            <FooterEl />
          </Page>

          {/* Pg 6: Estadísticas de tráfico + Comentarios y Recomendaciones */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Estadísticas y Recomendaciones</Text>
              </View>

              {/* Estadísticas de tráfico */}
              {traffic_stats && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Estadísticas de Tráfico</Text>
                  <View style={s.table}>
                    <View style={[s.tHead, { backgroundColor: acc }]}>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Métrica</Text>
                      <Text style={[s.tHeadText, { flex: 2 }]}>Valor</Text>
                    </View>
                    {[
                      { label: 'Total Usuarios', value: formatNum(traffic_stats.total_users) },
                      { label: 'Total Aplicaciones', value: formatNum(traffic_stats.total_apps) },
                      { label: 'Total Sesiones', value: formatNum(traffic_stats.total_sessions) },
                      { label: 'Fecha más activa', value: traffic_stats.most_active_date ?? '—' },
                      { label: 'Bytes totales', value: formatBytes(traffic_stats.bytes_total) },
                      { label: 'Total destinos únicos', value: formatNum(traffic_stats.total_destinations) },
                      { label: 'Promedio sesiones/día', value: formatNum(traffic_stats.avg_sessions_per_day) },
                      { label: 'Promedio bytes/día', value: formatBytes(traffic_stats.avg_bytes_per_day) },
                    ].map((row, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={[s.tCell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>{row.label}</Text>
                        <Text style={[s.tCell, { flex: 2 }]}>{row.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Comentarios y recomendaciones (IA) */}
              {tech && (
                <>
                  <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Comentarios y Recomendaciones</Text>
                    <Text style={s.bodyText}>{tech.threat_analysis}</Text>
                    {tech.technical_findings.length > 0 && tech.technical_findings.map((f, i) => (
                      <View key={i} style={s.listItem}>
                        <Text style={[s.bullet, { color: acc }]}>▸</Text>
                        <Text style={s.listText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Acciones Técnicas Recomendadas</Text>
                    {tech.recommendations.map((rec, i) => (
                      <View key={i} style={[s.recBox, { borderLeftColor: acc }]}>
                        <Text style={[s.recNumber, { color: acc }]}>Acción {i + 1}</Text>
                        <Text style={s.recText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Sign-off técnico */}
              <View style={[s.section, { marginTop: 12 }]}>
                <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Revisión y Aprobación Técnica</Text>
                {[{ role: 'Ingeniero de Seguridad responsable' }, { role: 'CISO / Jefe de Infraestructura' }].map((signer, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 14 }}>{signer.role}</Text>
                      <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '80%' }} />
                      <Text style={{ fontSize: 7, color: GRAY, marginTop: 3 }}>Nombre y firma</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 14 }}>Fecha</Text>
                      <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '60%' }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <FooterEl />
          </Page>

          {/* Apéndice A — Dispositivos */}
          {metrics.devices.length > 0 && (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                  <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                  <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Apéndice A — Inventario de dispositivos</Text>
                </View>
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Apéndice A — Dispositivos Monitoreados</Text>
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
              <FooterEl />
            </Page>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          REPORTE DE CUMPLIMIENTO — Pgs 2, 3 y 4
      ═══════════════════════════════════════════════════════ */}
      {isComp && (
        <>
          {/* Pg 2: Resumen + Métricas de auditoría */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Resumen de cumplimiento · {period.start} — {period.end}</Text>
              </View>

              {comp && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Resumen de Cumplimiento</Text>
                  <Text style={s.bodyText}>{comp.compliance_summary}</Text>
                </View>
              )}

              {/* Evidencia de auditoría — métricas */}
              <View style={s.section}>
                <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Evidencia de Auditoría — Métricas del Período</Text>
                <View style={s.kpiGrid}>
                  {[
                    { v: formatNum(summary.total_events), l: 'Eventos registrados', c: DARK },
                    { v: formatNum(summary.blocked_events), l: `Accesos bloqueados (${summary.block_rate_pct}%)`, c: acc },
                    { v: formatNum(summary.threat_events), l: 'Incidentes de seguridad', c: AMBER },
                    { v: String(severity_breakdown['critical'] ?? 0), l: 'Eventos críticos', c: severity_breakdown['critical'] > 0 ? RED : GREEN },
                    { v: String(summary.active_devices), l: 'Activos monitoreados', c: GREEN },
                    { v: `${period.days} días`, l: 'Cobertura de logs', c: DARK },
                  ].map((item, i) => (
                    <View key={i} style={[s.kpiBox, { backgroundColor: LIGHT, borderLeftWidth: 3, borderLeftColor: acc }]}>
                      <Text style={[s.kpiValue, { color: item.c, fontSize: 15 }]}>{item.v}</Text>
                      <Text style={s.kpiLabel}>{item.l}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {comp && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Estado de Retención de Datos</Text>
                  <View style={[s.recBox, { borderLeftColor: acc }]}>
                    <Text style={s.recText}>{comp.data_retention_status}</Text>
                  </View>
                </View>
              )}
            </View>
            <FooterEl />
          </Page>

          {/* Pg 3: Hallazgos de auditoría */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Hallazgos de auditoría</Text>
              </View>

              {comp && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Hallazgos de Auditoría — Evaluación de Controles</Text>
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
                  <Text style={[s.sectionTitle, { color: RED, borderBottomColor: `${RED}30` }]}>Brechas Regulatorias Identificadas</Text>
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
            <FooterEl />
          </Page>

          {/* Pg 4: IPs + Plan de remediación */}
          <Page size="A4" style={s.page}>
            <View style={s.pageInner}>
              <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Plan de remediación</Text>
              </View>

              {/* Tabla de accesos bloqueados como evidencia */}
              {top_blocked_ips.length > 0 && (
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Registro de Accesos Bloqueados (Evidencia Forense)</Text>
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
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Plan de Remediación</Text>
                  <View style={[s.recBox, { borderLeftColor: acc, backgroundColor: `${acc}08` }]}>
                    <Text style={[s.recNumber, { color: acc }]}>Línea de tiempo de remediación</Text>
                    <Text style={s.recText}>{comp.remediation_timeline}</Text>
                  </View>
                </View>
              )}

              {/* Sign-off section */}
              <View style={[s.section, { marginTop: 28 }]}>
                <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Sección de Firma y Aprobación</Text>
                {[
                  { role: 'CISO / Responsable de Seguridad' },
                  { role: 'Oficial de Cumplimiento' },
                  { role: 'Auditor / Revisor' },
                ].map((signer, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 4 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>{signer.role}</Text>
                      <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '80%' }} />
                      <Text style={{ fontSize: 7, color: GRAY, marginTop: 3 }}>Nombre y firma</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, color: GRAY, marginBottom: 16 }}>Fecha</Text>
                      <View style={{ height: 1, backgroundColor: '#cbd5e1', width: '60%' }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <FooterEl />
          </Page>

          {/* Pg 6: Apéndice — Dispositivos */}
          {metrics.devices.length > 0 && (
            <Page size="A4" style={s.page}>
              <View style={s.pageInner}>
                <View style={[s.pageHeader, { borderBottomColor: acc }]}>
                  <Text style={[s.pageHeaderLogo, { color: acc }]}>{logoText}</Text>
                  <Text style={s.pageHeaderMeta}>{TYPE_LABELS[reportType]} · {organization.name}{'\n'}Apéndice — Activos monitoreados</Text>
                </View>
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { color: acc, borderBottomColor: `${acc}30` }]}>Apéndice A — Inventario de Activos Auditados</Text>
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
              <FooterEl />
            </Page>
          )}
        </>
      )}

    </Document>
  )
}
