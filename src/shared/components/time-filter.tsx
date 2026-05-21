'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Radio } from 'lucide-react'

const OPTS = [
  { label: 'Ahora', value: '0'   },
  { label: '1h',    value: '1'   },
  { label: '24h',   value: '24'  },
  { label: '7d',    value: '168' },
  { label: '30d',   value: '720' },
]

function Inner({ current }: { current: string }) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  function go(value: string) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('hours', value)
    p.delete('page')
    router.push(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 glass rounded-xl p-1">
      {OPTS.map(opt => {
        const active = current === opt.value
        const isLive = opt.value === '0'
        return (
          <button
            key={opt.value}
            onClick={() => go(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              active
                ? 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30'
                : 'text-[#334155] hover:text-[#64748b]'
            }`}
          >
            {isLive && active && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0 animate-pulse" />
            )}
            {isLive && !active && <Radio className="w-3 h-3 shrink-0" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function TimeFilter({ current }: { current: string }) {
  return (
    <Suspense fallback={null}>
      <Inner current={current} />
    </Suspense>
  )
}

