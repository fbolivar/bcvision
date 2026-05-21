'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard, CheckCircle, AlertCircle, Clock, Loader2,
  Receipt, Calendar, BadgeCheck, XCircle,
} from 'lucide-react'

interface Invoice {
  id: string
  amount_in_cents: number
  status: string
  wompi_reference: string | null
  period_start: string
  period_end: string
  paid_at: string | null
  created_at: string
}

interface Subscription {
  status: string
  current_period_start: string | null
  current_period_end: string | null
}

interface BillingData {
  org:          { name: string; plan: string; monthly_price: number } | null
  subscription: Subscription | null
  invoices:     Invoice[]
}

const STATUS_STYLE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid:    { label: 'Pagado',    color: 'text-[#22c55e]', icon: CheckCircle },
  pending: { label: 'Pendiente', color: 'text-[#fbbf24]', icon: Clock },
  failed:  { label: 'Fallido',   color: 'text-[#f87171]', icon: XCircle },
  expired: { label: 'Expirado',  color: 'text-[#475569]', icon: XCircle },
}

const PLAN_COLOR: Record<string, string> = {
  basico:      '#64748b',
  profesional: '#3b82f6',
  empresarial: '#a78bfa',
}

function formatCOP(cents: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(cents / 100)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BillingTab() {
  const searchParams  = useSearchParams()
  const [data,    setData]    = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying,  setPaying]  = useState(false)
  const [msg,     setMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchBilling = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/billing/status')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBilling()
    // Si Wompi redirigió de vuelta con una referencia, mostrar confirmación
    const ref = searchParams.get('ref')
    if (ref?.startsWith('BCVision-')) {
      setMsg({ type: 'ok', text: 'Pago recibido. El estado se actualizará en unos segundos.' })
    }
  }, [fetchBilling, searchParams])

  async function handlePay() {
    setPaying(true)
    setMsg(null)
    const res = await fetch('/api/billing/checkout', { method: 'POST' })
    const json = await res.json()
    setPaying(false)

    if (!res.ok) return setMsg({ type: 'err', text: json.error ?? 'Error iniciando pago' })

    const { checkout } = json as { checkout: {
      publicKey: string; currency: string; amountInCents: number
      reference: string; expirationTime: string; integrityHash: string
      customerEmail?: string; redirectUrl: string
    }}

    // Abrir widget Wompi inyectando el script y el botón oculto
    const existingScript = document.getElementById('wompi-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id  = 'wompi-script'
      script.src = 'https://checkout.wompi.co/widget.js'
      script.setAttribute('data-render', 'button')
      document.head.appendChild(script)
    }

    // Crear form con los datos y hacer submit para abrir el checkout
    const form = document.createElement('form')
    form.method = 'GET'
    form.action = 'https://checkout.wompi.co/p/'
    form.target = '_blank'

    const fields: Record<string, string> = {
      'public-key':       checkout.publicKey,
      currency:           checkout.currency,
      'amount-in-cents':  String(checkout.amountInCents),
      reference:          checkout.reference,
      'expiration-time':  checkout.expirationTime,
      'signature:integrity': checkout.integrityHash,
      'redirect-url':     checkout.redirectUrl,
    }
    if (checkout.customerEmail) fields['customer-data:email'] = checkout.customerEmail

    for (const [key, val] of Object.entries(fields)) {
      const input = document.createElement('input')
      input.type  = 'hidden'
      input.name  = key
      input.value = val
      form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)

    // Refrescar datos después de un momento
    setTimeout(fetchBilling, 5000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#3b82f6] animate-spin" />
      </div>
    )
  }

  const { org, subscription, invoices } = data ?? { org: null, subscription: null, invoices: [] }
  const isActive  = subscription?.status === 'active'
  const planColor = PLAN_COLOR[org?.plan ?? 'basico'] ?? '#64748b'
  const hasPricing = (org?.monthly_price ?? 0) > 0

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Mensaje de estado */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
          msg.type === 'ok'
            ? 'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]'
            : 'bg-[#ef4444]/10 border-[#ef4444]/20 text-[#f87171]'
        }`}>
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Plan actual + estado */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4" style={{ color: planColor }} />
          <h3 className="text-sm font-bold text-white">Plan y suscripción</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white capitalize">{org?.plan ?? '—'}</span>
              {isActive ? (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/25 text-[#22c55e] font-bold">
                  <BadgeCheck className="w-3 h-3" />ACTIVO
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/25 text-[#fbbf24] font-bold">
                  PENDIENTE PAGO
                </span>
              )}
            </div>
            {isActive && subscription?.current_period_end && (
              <p className="text-xs text-[#475569] mt-1">
                Próximo cobro: <span className="text-white">{formatDate(subscription.current_period_end)}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">
              {hasPricing ? formatCOP((org?.monthly_price ?? 0) * 100) : 'Sin precio'}
            </p>
            <p className="text-xs text-[#475569]">por mes</p>
          </div>
        </div>

        {!hasPricing ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0a1225] border border-[#1e3a5f]">
            <AlertCircle className="w-3.5 h-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
            <p className="text-xs text-[#475569]">Tu proveedor aún no ha configurado el precio de tu plan. Contáctalo para activar tu suscripción.</p>
          </div>
        ) : (
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex items-center gap-2 w-full justify-center px-5 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
          >
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {paying ? 'Abriendo pasarela...' : isActive ? 'Renovar suscripción' : 'Pagar suscripción'}
          </button>
        )}

        <p className="text-[10px] text-[#1e3a5f] text-center">
          Pago seguro procesado por Wompi · Tarjeta, PSE, Nequi o Bancolombia
        </p>
      </div>

      {/* Historial de facturas */}
      {invoices.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0f2038] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#475569]" />
            <h3 className="text-sm font-bold text-white">Historial de pagos</h3>
          </div>
          <div className="divide-y divide-[#0a1628]">
            {invoices.map(inv => {
              const s = STATUS_STYLE[inv.status] ?? STATUS_STYLE.pending
              const Icon = s.icon
              return (
                <div key={inv.id} className="px-5 py-3.5 flex items-center gap-4">
                  <Icon className={`w-4 h-4 shrink-0 ${s.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium">
                      {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
                    </p>
                    <p className="text-[10px] text-[#334155] font-mono mt-0.5 truncate">
                      {inv.wompi_reference ?? inv.id}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{formatCOP(inv.amount_in_cents)}</p>
                    <p className={`text-[10px] font-bold ${s.color}`}>{s.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <Calendar className="w-8 h-8 text-[#1e3a5f] mx-auto mb-3" />
          <p className="text-sm text-[#334155]">Sin facturas registradas</p>
          <p className="text-xs text-[#1e3a5f] mt-1">Aquí aparecerá tu historial de pagos</p>
        </div>
      )}
    </div>
  )
}
