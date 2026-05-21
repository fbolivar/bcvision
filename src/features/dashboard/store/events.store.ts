import { create } from 'zustand'
import type { FirewallEvent } from '@/shared/types/database'

const MAX_LIVE_EVENTS = 200

interface EventsState {
  liveEvents: FirewallEvent[]
  addEvent: (event: FirewallEvent) => void
  clearEvents: () => void
}

export const useEventsStore = create<EventsState>((set) => ({
  liveEvents: [],
  addEvent: (event) =>
    set((state) => ({
      liveEvents: [event, ...state.liveEvents].slice(0, MAX_LIVE_EVENTS),
    })),
  clearEvents: () => set({ liveEvents: [] }),
}))
