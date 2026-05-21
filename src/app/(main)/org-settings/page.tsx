export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/shared/components/topbar'
import { OrgSettingsForm } from '@/features/org-settings/components/org-settings-form'

export default async function OrgSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/login')

  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  const [{ data: org }, { data: settings }] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', profile.org_id).single(),
    supabase.from('org_settings').select('*').eq('org_id', profile.org_id).single(),
  ])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Configuración avanzada" subtitle="Marca, notificaciones, retención y cumplimiento" />
      <div className="flex-1 p-6 overflow-y-auto mesh-bg">
        <OrgSettingsForm org={org} settings={settings} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
