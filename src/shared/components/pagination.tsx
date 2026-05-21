'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const go = (p: number) => {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    router.push(`${pathname}?${next.toString()}`)
  }

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1
    if (i === 0) return 1
    if (i === 6) return totalPages
    if (page <= 4) return i + 1
    if (page >= totalPages - 3) return totalPages - 6 + i
    return page - 3 + i
  })

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#2d3148] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => go(p)}
          className={cn(
            'w-8 h-8 rounded text-sm font-medium transition-colors',
            p === page
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-[#2d3148]'
          )}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#2d3148] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
