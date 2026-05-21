export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/shared/components/topbar'
import { ReportsList } from '@/features/reports/components/reports-list'
import { ScheduleReportForm } from '@/features/reports/components/schedule-report-form'
import { Sparkles, FileText } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/login')

  const canGenerate = ['admin', 'analyst'].includes(profile.role)
  const { data: reports } = await supabase
    .from('reports')
    .select('id, title, type, status, period_start, period_end, created_at, generated_at, content_json')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Reportes" subtitle="Análisis de seguridad con IA" />

      <div className="flex-1 p-6 overflow-y-auto mesh-bg">
        {/* AI Banner */}
        <div className="flex items-center gap-4 p-4 glass rounded-2xl border-[#3b82f6]/20 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/5 to-[#8b5cf6]/5" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 border border-[#3b82f6]/25 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#60a5fa]" />
          </div>
          <div className="relative">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              Análisis con IA · Claude (Anthropic)
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30 rounded-full uppercase tracking-wider">claude-sonnet-4-6</span>
            </div>
            <div className="text-xs text-[#475569] mt-0.5">
              Cada reporte incluye narrativa ejecutiva, hallazgos clave y recomendaciones priorizadas en español colombiano.
            </div>
          </div>
        </div>

        {canGenerate && (
          <div className="flex justify-end mb-4">
            <ScheduleReportForm />
          </div>
        )}

        {canGenerate ? (
          <ReportsList initialReports={reports ?? []} />
        ) : (
          <div>
            <div className="mb-4 p-4 glass rounded-xl border-[#f59e0b]/20 text-sm text-[#fbbf24]">
              Solo administradores y analistas pueden generar nuevos reportes.
            </div>
            {(reports ?? []).length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <FileText className="w-10 h-10 text-[#1e3a5f] mx-auto mb-4" />
                <p className="text-[#475569] text-sm">No hay reportes disponibles</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {(reports ?? []).map(r => (
                  <div key={r.id} className="glass rounded-xl p-4 hover-card">
                    <div className="font-semibold text-white">{r.title}</div>
                    <div className="text-xs text-[#475569] mt-1 font-mono">{r.period_start} → {r.period_end}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
