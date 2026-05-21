'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEventsStore } from '@/features/dashboard/store/events.store'
import type { FirewallEvent } from '@/shared/types/database'

export function useRealtimeEvents(orgId: string) {
  const addEvent = useEventsStore(s => s.addEvent)
  const channelRef = useRef<ReturnType<typeof createClient>['channel'] | null>(null)

  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`org-events-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'firewall_events',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          addEvent(payload.new as FirewallEvent)
        }
      )
      .subscribe()

    channelRef.current = channel as unknown as ReturnType<typeof createClient>['channel']

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, addEvent])
}
