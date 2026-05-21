export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/shared/components/topbar'
import { SettingsTabs } from '@/features/settings/components/settings-tabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, orgRes] = await Promise.all([
    supabase.from('users').select('id, full_name, role, email, org_id, phone, timezone, notif_email, notif_alerts, avatar_url').eq('id', user.id).single(),
    supabase.from('users').select('org_id').eq('id', user.id).single(),
  ])

  const profile = profileRes.data
  if (!profile?.org_id) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.org_id)
    .single()

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: true })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Ajustes" subtitle="Configuración de cuenta y organización" />
      <main className="flex-1 p-6 mesh-bg overflow-y-auto">
        <SettingsTabs
          user={{ id: user.id, email: user.email ?? '' }}
          profile={profile}
          org={org}
          members={members ?? []}
          isAdmin={profile.role === 'admin'}
        />
      </main>
    </div>
  )
}
