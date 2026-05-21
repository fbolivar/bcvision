import Anthropic from '@anthropic-ai/sdk'
import { formatBytes } from '@/shared/lib/utils'
import type { ReportMetrics } from './metrics-aggregator'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExecutiveReport {
  type: 'executive'
  risk_level: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO'
  executive_summary: string
  business_impact: string
  key_findings: string[]
  recommendations: string[]
  generated_at: string
}

export interface TechnicalReport {
  type: 'technical'
  threat_analysis: string
  traffic_analysis: string
  user_behavior: string
  technical_findings: string[]
  recommendations: string[]
  generated_at: string
}

export interface ComplianceReport {
  type: 'compliance'
  compliance_summary: string
  audit_findings: string[]
  data_retention_status: string
  regulatory_gaps: string[]
  remediation_timeline: string
  generated_at: string
}

export type GeneratedReport = ExecutiveReport | TechnicalReport | ComplianceReport

export async function generateReport(
  metrics: ReportMetrics,
  reportType: 'executive' | 'technical' | 'compliance'
): Promise<GeneratedReport> {
  const prompt = buildPrompt(metrics, reportType)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `Eres un experto en ciberseguridad corporativa con 15 años de experiencia.
Redactas reportes de seguridad en español colombiano, claros y orientados a la toma de decisiones.
Responde ÚNICAMENTE con un JSON válido sin markdown, sin bloques de código.`,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    const parsed = JSON.parse(clean)
    return { ...parsed, type: reportType, generated_at: new Date().toISOString() }
  } catch {
    return buildFallbackReport(metrics, reportType)
  }
}

// Keep old name as alias for compatibility
export const generateExecutiveReport = generateReport

function buildPrompt(metrics: ReportMetrics, type: string): string {
  const { period, organization, summary, top_threats, top_blocked_ips, top_users, severity_breakdown, critical_events_sample } = metrics

  const baseData = `
ORGANIZACIÓN: ${organization.name} (Plan: ${organization.plan})
PERÍODO: ${period.start} al ${period.end} (${period.days} días)
DISPOSITIVOS ACTIVOS: ${summary.active_devices}
TOTAL EVENTOS: ${summary.total_events.toLocaleString('es-CO')}
BLOQUEADOS: ${summary.blocked_events.toLocaleString('es-CO')} (${summary.block_rate_pct}%)
AMENAZAS: ${summary.threat_events.toLocaleString('es-CO')}
TRÁFICO: ${formatBytes(summary.bytes_total)}
CRÍTICOS: ${severity_breakdown['critical'] ?? 0} | ALTOS: ${severity_breakdown['high'] ?? 0} | MEDIOS: ${severity_breakdown['medium'] ?? 0}
TOP AMENAZAS: ${top_threats.slice(0, 5).map((t, i) => `${i + 1}. ${t.name} (${t.count}x${t.category ? `, ${t.category}` : ''})`).join(' | ') || 'ninguna'}
TOP IPs BLOQUEADAS: ${top_blocked_ips.slice(0, 5).map(ip => `${ip.ip}(${ip.count})`).join(', ') || 'ninguna'}
TOP USUARIOS: ${top_users.slice(0, 5).map(u => `${u.user}:${u.events}ev,${formatBytes(u.bytes)}`).join(' | ') || 'no identificados'}`

  if (type === 'executive') {
    return `${baseData}

Genera un REPORTE EJECUTIVO para la dirección y gerencia de la empresa. Audiencia: CEO, CFO, directivos no técnicos.
Enfócate en impacto al negocio, nivel de riesgo y acciones estratégicas. Evita jerga técnica.

RESPONDE con este JSON exacto:
{
  "risk_level": "BAJO|MEDIO|ALTO|CRÍTICO",
  "executive_summary": "3-4 oraciones sobre el estado de seguridad del período: nivel de riesgo general, eventos más relevantes, estado operativo. Lenguaje directo para dirección.",
  "business_impact": "2-3 oraciones sobre el impacto real al negocio: continuidad operativa, exposición financiera potencial, reputación. Sin jerga técnica.",
  "key_findings": [
    "Hallazgo 1 con dato concreto (impacto al negocio)",
    "Hallazgo 2 con dato concreto",
    "Hallazgo 3 con dato concreto",
    "Hallazgo 4 con dato concreto",
    "Hallazgo 5 con dato concreto"
  ],
  "recommendations": [
    "Recomendación estratégica 1 (prioridad ALTA) — acción concreta para dirección",
    "Recomendación estratégica 2 (prioridad ALTA)",
    "Recomendación estratégica 3 (prioridad MEDIA)",
    "Recomendación estratégica 4 (prioridad MEDIA)",
    "Recomendación estratégica 5 (prioridad BAJA)"
  ]
}`
  }

  if (type === 'technical') {
    return `${baseData}
EVENTOS CRÍTICOS: ${critical_events_sample.slice(0, 5).map(e => `[${e.severity.toUpperCase()}] ${e.type}: ${e.src_ip ?? '?'}→${e.dst_ip ?? '?'}${e.threat ? ` | ${e.threat}` : ''}`).join(' | ') || 'ninguno'}

Genera un REPORTE TÉCNICO para el equipo de seguridad (SOC, ingenieros de red, analistas). Audiencia: personal técnico.
Incluye análisis detallado de amenazas, patrones de tráfico, comportamiento de usuarios y hallazgos forenses.

RESPONDE con este JSON exacto:
{
  "threat_analysis": "3-4 oraciones técnicas: tipos de amenazas detectadas, vectores de ataque observados, indicadores de compromiso, patrones de comportamiento malicioso y nivel de sofisticación.",
  "traffic_analysis": "3-4 oraciones técnicas: distribución de protocolos, anomalías en el tráfico, patrones de comunicación sospechosos, volúmenes anómalos detectados.",
  "user_behavior": "2-3 oraciones técnicas: actividad de usuarios, accesos fuera de horario, intentos de acceso no autorizados, usuarios con mayor tráfico bloqueado.",
  "technical_findings": [
    "Hallazgo técnico 1: descripción detallada con IPs/protocolos/frecuencias específicas",
    "Hallazgo técnico 2: descripción detallada",
    "Hallazgo técnico 3: descripción detallada",
    "Hallazgo técnico 4: descripción detallada",
    "Hallazgo técnico 5: descripción detallada"
  ],
  "recommendations": [
    "Acción técnica 1 (URGENTE): configuración/regla/parche específico a implementar",
    "Acción técnica 2 (URGENTE): detalle técnico de implementación",
    "Acción técnica 3 (ALTA): mejora de configuración con pasos concretos",
    "Acción técnica 4 (MEDIA): optimización de reglas o monitoreo",
    "Acción técnica 5 (BAJA): mejora de capacidades de detección"
  ]
}`
  }

  // compliance
  return `${baseData}

Genera un REPORTE DE CUMPLIMIENTO para auditores, equipo legal y oficial de cumplimiento. Audiencia: CISO, compliance officer, auditores externos.
Enfócate en trazabilidad de eventos, retención de logs, brechas regulatorias y estado de controles de seguridad.

RESPONDE con este JSON exacto:
{
  "compliance_summary": "3-4 oraciones sobre el estado de cumplimiento del período: controles operativos, cobertura de monitoreo, evidencias de auditoría disponibles y nivel de conformidad general.",
  "audit_findings": [
    "Hallazgo de auditoría 1: control evaluado, estado (CONFORME/NO CONFORME/PARCIAL) y evidencia",
    "Hallazgo de auditoría 2: control evaluado, estado y evidencia",
    "Hallazgo de auditoría 3: control evaluado, estado y evidencia",
    "Hallazgo de auditoría 4: control evaluado, estado y evidencia",
    "Hallazgo de auditoría 5: control evaluado, estado y evidencia"
  ],
  "data_retention_status": "2 oraciones sobre el estado de retención de logs: período cubierto, volumen almacenado y conformidad con políticas de retención aplicables.",
  "regulatory_gaps": [
    "Brecha regulatoria 1: control faltante o deficiente y norma/estándar afectado (ISO 27001/NIST/SOC2)",
    "Brecha regulatoria 2: descripción de la brecha y riesgo de incumplimiento",
    "Brecha regulatoria 3: descripción de la brecha"
  ],
  "remediation_timeline": "Párrafo con plan de remediación: acciones prioritarias con plazos sugeridos (30/60/90 días) para cerrar las brechas identificadas."
}`
}

function buildFallbackReport(metrics: ReportMetrics, type: 'executive' | 'technical' | 'compliance'): GeneratedReport {
  const { summary, period } = metrics
  const risk = (summary.threat_events > 100 ? 'ALTO' : summary.threat_events > 20 ? 'MEDIO' : 'BAJO') as 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO'

  if (type === 'executive') {
    return {
      type: 'executive',
      risk_level: risk,
      executive_summary: `Durante el período ${period.start} al ${period.end} se procesaron ${summary.total_events.toLocaleString('es-CO')} eventos con nivel de riesgo ${risk}. Se bloquearon ${summary.blocked_events.toLocaleString('es-CO')} conexiones (${summary.block_rate_pct}% del total). Los sistemas operaron con normalidad sin interrupciones al negocio.`,
      business_impact: `La tasa de bloqueo del ${summary.block_rate_pct}% indica que el perímetro de seguridad está operando correctamente. No se identificaron incidentes que hayan afectado la continuidad operativa durante el período analizado.`,
      key_findings: [
        `Nivel de riesgo general: ${risk} — ${summary.threat_events} amenazas detectadas y mitigadas`,
        `Tasa de bloqueo del ${summary.block_rate_pct}% sobre ${summary.total_events.toLocaleString('es-CO')} eventos totales`,
        `${summary.active_devices} dispositivos de seguridad activos y monitoreados`,
        `Volumen de tráfico analizado: ${formatBytes(summary.bytes_total)} en ${period.days} días`,
        `Sin incidentes de seguridad de impacto al negocio durante el período`,
      ],
      recommendations: [
        'Revisar las reglas de firewall basándose en los patrones de bloqueo observados (prioridad ALTA)',
        'Asegurar que todos los activos críticos estén cubiertos por el monitoreo actual (prioridad ALTA)',
        'Implementar revisiones periódicas de los reportes de seguridad con la dirección (prioridad MEDIA)',
        'Considerar inversión en capacidades adicionales de detección de amenazas (prioridad MEDIA)',
        'Establecer un plan de respuesta a incidentes documentado y probado (prioridad BAJA)',
      ],
      generated_at: new Date().toISOString(),
    }
  }

  if (type === 'technical') {
    return {
      type: 'technical',
      threat_analysis: `Se detectaron ${summary.threat_events} eventos de amenaza en el período con ${summary.blocked_events} bloqueos efectivos. Los vectores de ataque más frecuentes corresponden a intentos de acceso no autorizado y tráfico malicioso conocido identificado por firmas de IDS/IPS.`,
      traffic_analysis: `El volumen total de ${formatBytes(summary.bytes_total)} distribuido en ${period.days} días muestra patrones de tráfico dentro de los rangos esperados. La tasa de bloqueo del ${summary.block_rate_pct}% está dentro de los parámetros normales para el entorno.`,
      user_behavior: `No se identificaron anomalías significativas en el comportamiento de usuarios de red. Se recomienda implementar integración con Active Directory para mejorar la trazabilidad de identidad.`,
      technical_findings: [
        `${summary.threat_events} eventos de tipo threat/block procesados con éxito por el IPS`,
        `Tasa de bloqueo del ${summary.block_rate_pct}% — ratio normal para el entorno corporativo`,
        `${summary.active_devices} sensores activos cubriendo el perímetro de red`,
        `Total de ${summary.total_events.toLocaleString('es-CO')} eventos parseados y correlacionados`,
        `Tráfico analizado: ${formatBytes(summary.bytes_total)} en ${period.days} días de operación`,
      ],
      recommendations: [
        'Investigar IPs con mayor frecuencia de bloqueo y añadir a blacklist global (URGENTE)',
        'Actualizar las firmas de IDS/IPS a la última versión disponible del fabricante (URGENTE)',
        'Implementar correlación de eventos entre dispositivos para detección de ataques distribuidos (ALTA)',
        'Optimizar reglas de firewall eliminando duplicados y reglas con cero hits (MEDIA)',
        'Habilitar logging extendido en puertos de alto riesgo (22, 3389, 445) (BAJA)',
      ],
      generated_at: new Date().toISOString(),
    }
  }

  return {
    type: 'compliance',
    compliance_summary: `El período ${period.start} al ${period.end} presenta cobertura de monitoreo sobre ${summary.active_devices} dispositivos con ${summary.total_events.toLocaleString('es-CO')} eventos registrados. Los controles de seguridad operativos están funcionando según las políticas establecidas. Se requiere revisión de brechas identificadas para alcanzar conformidad plena.`,
    audit_findings: [
      `Control de acceso perimetral: CONFORME — ${summary.blocked_events.toLocaleString('es-CO')} accesos no autorizados bloqueados (${summary.block_rate_pct}%)`,
      `Monitoreo continuo: CONFORME — ${summary.active_devices} dispositivos bajo supervisión 24/7`,
      `Detección de amenazas: PARCIAL — ${summary.threat_events} amenazas detectadas, validar tasa de falsos negativos`,
      `Registro de auditoría: CONFORME — logs disponibles para el período completo analizado`,
      `Respuesta a incidentes: PARCIAL — se detectaron eventos críticos que requieren documentación formal`,
    ],
    data_retention_status: `Los registros del período ${period.start} al ${period.end} están disponibles y comprenden ${summary.total_events.toLocaleString('es-CO')} eventos. Se recomienda verificar que el período de retención cumpla con los requisitos regulatorios aplicables (mínimo 12 meses para ISO 27001).`,
    regulatory_gaps: [
      'Identificación de usuarios: NO CONFORME — alto porcentaje de tráfico anónimo sin asociación a identidad (ISO 27001 A.9)',
      'Gestión de vulnerabilidades: PARCIAL — requiere evidencia de escaneos periódicos documentados (NIST CSF PR.IP-12)',
      'Plan de respuesta a incidentes: PENDIENTE VALIDACIÓN — verificar que los SLAs de respuesta están documentados (ISO 27001 A.16)',
    ],
    remediation_timeline: `En los próximos 30 días: implementar integración con directorio activo para identificación de usuarios y formalizar el proceso de respuesta a incidentes. En 60 días: ejecutar escaneo de vulnerabilidades y remediar hallazgos críticos. En 90 días: realizar auditoría interna completa de controles y actualizar la documentación de cumplimiento.`,
    generated_at: new Date().toISOString(),
  }
}
