'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  enabled: boolean
  intervalMs?: number
}

export function LiveRefresh({ enabled, intervalMs = 30_000 }: Props) {
  const router = useRouter()
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, enabled, intervalMs])
  return null
}
