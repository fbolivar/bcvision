'use client'

import { useState } from 'react'
import { User, Building2, Users, Shield, CreditCard } from 'lucide-react'
import { ProfileTab } from './profile-tab'
import { OrgTab } from './org-tab'
import { MembersTab } from './members-tab'
import { SecurityTab } from './security-tab'
import { BillingTab } from './billing-tab'

interface Props {
  user: { id: string; email: string }
  profile: {
    id: string
    full_name: string | null
    role: string
    email: string
    org_id: string
    phone?: string | null
    timezone?: string | null
    notif_email?: boolean | null
    notif_alerts?: boolean | null
    avatar_url?: string | null
  }
  org: {
    id: string
    name: string
    slug: string
    plan: string
    max_devices: number
    retention_days: number
  } | null
  members: Array<{
    id: string
    full_name: string | null
    email: string
    role: string
    created_at: string
  }>
  isAdmin: boolean
}

const ALL_TABS = [
  { id: 'profile',  label: 'Mi Perfil',    icon: User,       roles: ['admin', 'analyst', 'viewer'] },
  { id: 'org',      label: 'Organización', icon: Building2,  roles: ['admin', 'analyst'] },
  { id: 'members',  label: 'Miembros',     icon: Users,      roles: ['admin'] },
  { id: 'security', label: 'Seguridad',    icon: Shield,     roles: ['admin', 'analyst', 'viewer'] },
  { id: 'billing',  label: 'Facturación',  icon: CreditCard, roles: ['admin'] },
]

export function SettingsTabs({ user, profile, org, members, isAdmin }: Props) {
  const [active, setActive] = useState('profile')
  const tabs = ALL_TABS.filter(t => t.roles.includes(profile.role))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-\[#0f2038\] mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              active === t.id
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#6b7280] hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === 'profile'  && <ProfileTab user={user} profile={profile} />}
      {active === 'org'      && <OrgTab org={org} isAdmin={isAdmin} />}
      {active === 'members'  && <MembersTab members={members} isAdmin={isAdmin} currentUserId={user.id} />}
      {active === 'security' && <SecurityTab email={user.email} />}
      {active === 'billing'  && <BillingTab />}
    </div>
  )
}
