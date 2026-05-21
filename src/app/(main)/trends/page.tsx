export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/shared/components/topbar'
import { TrendsDashboard } from '@/features/trends/components/trends-dashboard'

export default async function TrendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/login')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Tendencias históricas" subtitle="Análisis comparativo 30 / 90 / 180 días" />
      <div className="flex-1 p-6 overflow-y-auto mesh-bg">
        <TrendsDashboard />
      </div>
    </div>
  )
}
