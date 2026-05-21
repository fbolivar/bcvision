'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Users, Activity, AlertTriangle, TrendingUp,
  Search, Plus, X, Loader2, CheckCircle, AlertCircle,
  ChevronRight, Pencil, Trash2,
} from 'lucide-react'

interface OrgStat { events: number; threats: number; alerts: number; members: number }
interface OrgSub  { status: string; current_period_end: string | null }
interface Org {
  id: string; name: string; slug: string; plan: string
  max_devices: number; monthly_price: number; created_at: string
  tax_id_type: string | null; tax_id: string | null
  stats: OrgStat; subscription: OrgSub | null
}
interface Props { orgs: Org[] }

function formatCOP(pesos: number): string {
  if (!pesos) return '$0'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pesos)
}

const PLAN_STYLE: Record<string, string> = {
  cortesia:    'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20',
  basico:      'text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20',
  profesional: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20',
  empresarial: 'text-[#a78bfa] bg-[#8b5cf6]/10 border-[#8b5cf6]/20',
}

const PLAN_OPTIONS = [
  { value: 'cortesia',    label: 'Cortesía',     devices: 5,   price: 0,        retention: '30 días',  features: 'Sin cobro · Dashboard · Alertas básicas' },
  { value: 'basico',      label: 'Básico',       devices: 5,   price: 350000,   retention: '30 días',  features: 'Dashboard · Alertas · PDF' },
  { value: 'profesional', label: 'Profesional',  devices: 20,  price: 900000,   retention: '90 días',  features: 'Compliance · Tendencias · Soporte prio.' },
  { value: 'empresarial', label: 'Empresarial',  devices: 999, price: 2500000,  retention: '365 días', features: 'White-label · API · SLA dedicado' },
]

function inputClass() {
  return 'w-full px-3 py-2.5 rounded-xl text-sm bg-[#060a12] border border-[#0f2038] text-white placeholder-[#334155] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 outline-none transition-colors'
}

/* ─── Modal: Nuevo cliente ─────────────────────────────────────────────── */
const TAX_ID_TYPES = ['NIT', 'CC', 'CE', 'RUT', 'PASAPORTE', 'OTRO']

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name,         setName]         = useState('')
  const [slug,         setSlug]         = useState('')
  const [plan,         setPlan]         = useState('profesional')
  const [maxDevices,   setMaxDevices]   = useState(20)
  const [monthlyPrice, setMonthlyPrice] = useState(900000)
  const [adminEmail,   setAdminEmail]   = useState('')
  const [taxIdType,    setTaxIdType]    = useState('NIT')
  const [taxId,        setTaxId]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [done,         setDone]         = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  function handlePlanChange(val: string) {
    setPlan(val)
    const opt = PLAN_OPTIONS.find(p => p.value === val)
    if (opt) { setMaxDevices(opt.devices); setMonthlyPrice(opt.price) }
  }

  async function handleCreate() {
    setError('')
    if (!name.trim())       return setError('El nombre es requerido')
    if (!slug.trim())       return setError('El slug es requerido')
    if (!adminEmail.trim()) return setError('El email del administrador es requerido')

    setLoading(true)
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug, plan, max_devices: maxDevices, monthly_price: monthlyPrice, admin_email: adminEmail.trim(), tax_id_type: taxIdType, tax_id: taxId.trim() || undefined }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) return setError(data.error ?? 'Error al crear cliente')
    setDone(true)
    setTimeout(() => { onCreated(); onClose() }, 2000)
  }

  return (
    <Modal title="Nuevo Cliente" subtitle="Crear organización y enviar invitación al admin" onClose={onClose}>
      {done ? (
        <SuccessState message="¡Cliente creado!" sub="Se envió invitación al email del administrador." />
      ) : (
        <>
          <Field label="Nombre de la empresa">
            <input value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="Ej: Empresa ABC S.A.S." className={inputClass()} />
          </Field>

          <Field label="Slug (identificador único)" hint="Solo letras minúsculas, números y guiones">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#334155] font-mono shrink-0">app/</span>
              <input value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="empresa-abc" className={`${inputClass()} font-mono`} />
            </div>
          </Field>

          <Field label="Plan">
            <div className="grid grid-cols-4 gap-2">
              {PLAN_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => handlePlanChange(opt.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    plan === opt.value
                      ? 'border-[#3b82f6] bg-[#3b82f6]/10'
                      : 'border-[#0f2038] bg-[#060a12] hover:border-[#1e3a5f]'
                  }`}>
                  <p className={`text-xs font-bold mb-0.5 ${plan === opt.value ? 'text-[#60a5fa]' : 'text-[#475569]'}`}>{opt.label}</p>
                  <p className={`text-[10px] font-semibold ${plan === opt.value ? 'text-white' : 'text-[#334155]'}`}>{formatCOP(opt.price)}/mes</p>
                  <p className={`text-[9px] mt-0.5 ${plan === opt.value ? 'text-[#475569]' : 'text-[#1e3a5f]'}`}>{opt.devices === 999 ? 'Ilimitados' : `${opt.devices} dispositivos`} · {opt.retention}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#334155] mt-1">{PLAN_OPTIONS.find(o => o.value === plan)?.features}</p>
          </Field>

          <Field label="Precio mensual (COP)" hint="Puedes ajustar si aplica descuento">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#475569]">$</span>
              <input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(parseInt(e.target.value) || 0)}
                min={0} className={`${inputClass()} pl-6`} />
            </div>
          </Field>

          <Field label="Máximo de dispositivos">
            <input type="number" value={maxDevices} onChange={e => setMaxDevices(parseInt(e.target.value) || 1)}
              min={1} max={10000} className={inputClass()} />
          </Field>

          <Field label="Identificación fiscal">
            <div className="flex gap-2">
              <select value={taxIdType} onChange={e => setTaxIdType(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-sm bg-[#060a12] border border-[#0f2038] text-white focus:border-[#3b82f6] outline-none transition-colors w-36 shrink-0">
                {TAX_ID_TYPES.map(t => <option key={t} value={t} className="bg-[#060a12]">{t}</option>)}
              </select>
              <input value={taxId} onChange={e => setTaxId(e.target.value)}
                placeholder={taxIdType === 'NIT' ? '900.123.456-7' : taxIdType === 'CC' ? '1.234.567.890' : 'Número de identificación'}
                className={inputClass()} />
            </div>
          </Field>

          <Field label="Email del administrador del cliente" hint="Recibirá un email de invitación para activar su cuenta">
            <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
              placeholder="admin@empresa.com" className={inputClass()} />
          </Field>

          {error && <ErrorBanner msg={error} />}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#475569] hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleCreate} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Creando...' : 'Crear cliente'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ─── Modal: Editar cliente ────────────────────────────────────────────── */
function EditClientModal({ org, onClose, onSaved }: { org: Org; onClose: () => void; onSaved: () => void }) {
  const [name,         setName]         = useState(org.name)
  const [plan,         setPlan]         = useState(org.plan)
  const [maxDevices,   setMaxDevices]   = useState(org.max_devices)
  const [monthlyPrice, setMonthlyPrice] = useState(org.monthly_price ?? 0)
  const [taxIdType,    setTaxIdType]    = useState(org.tax_id_type ?? 'NIT')
  const [taxId,        setTaxId]        = useState(org.tax_id ?? '')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [done,         setDone]         = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [delLoading,   setDelLoading]   = useState(false)

  async function handleSave() {
    setError('')
    if (!name.trim()) return setError('El nombre es requerido')
    setLoading(true)
    const res = await fetch(`/api/admin/clients/${org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), plan, max_devices: maxDevices, monthly_price: monthlyPrice, tax_id_type: taxIdType, tax_id: taxId.trim() || undefined }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error ?? 'Error al guardar')
    setDone(true)
    setTimeout(() => { onSaved(); onClose() }, 1500)
  }

  async function handleDelete() {
    setDelLoading(true)
    await fetch(`/api/admin/clients/${org.id}`, { method: 'DELETE' })
    setDelLoading(false)
    onSaved()
    onClose()
  }

  return (
    <Modal title="Editar cliente" subtitle={`Modificar configuración de ${org.name}`} onClose={onClose}>
      {done ? (
        <SuccessState message="¡Cambios guardados!" sub="" />
      ) : confirmDel ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20">
            <p className="text-sm text-[#f87171] font-semibold mb-1">¿Eliminar organización?</p>
            <p className="text-xs text-[#475569]">
              Esta acción eliminará <strong className="text-white">{org.name}</strong> y todos sus datos asociados. Esta acción es irreversible.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setConfirmDel(false)} className="px-4 py-2 text-sm text-[#475569] hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleDelete} disabled={delLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all">
              {delLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Sí, eliminar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Slug read-only */}
          <Field label="Slug (no editable)">
            <div className={`${inputClass()} opacity-50 cursor-not-allowed font-mono`}>{org.slug}</div>
          </Field>

          <Field label="Nombre de la empresa">
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre del cliente" className={inputClass()} />
          </Field>

          <Field label="Plan">
            <div className="grid grid-cols-4 gap-2">
              {PLAN_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => { setPlan(opt.value); setMaxDevices(opt.devices); setMonthlyPrice(opt.price) }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    plan === opt.value
                      ? 'border-[#3b82f6] bg-[#3b82f6]/10'
                      : 'border-[#0f2038] bg-[#060a12] hover:border-[#1e3a5f]'
                  }`}>
                  <p className={`text-xs font-bold mb-0.5 ${plan === opt.value ? 'text-[#60a5fa]' : 'text-[#475569]'}`}>{opt.label}</p>
                  <p className={`text-[10px] font-semibold ${plan === opt.value ? 'text-white' : 'text-[#334155]'}`}>{formatCOP(opt.price)}/mes</p>
                  <p className={`text-[9px] mt-0.5 ${plan === opt.value ? 'text-[#475569]' : 'text-[#1e3a5f]'}`}>{opt.devices === 999 ? 'Ilimitados' : `${opt.devices} dispositivos`} · {opt.retention}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#334155] mt-1">{PLAN_OPTIONS.find(o => o.value === plan)?.features}</p>
          </Field>

          <Field label="Máximo de dispositivos">
            <input type="number" value={maxDevices} onChange={e => setMaxDevices(parseInt(e.target.value) || 1)}
              min={1} max={10000} className={inputClass()} />
          </Field>

          <Field label="Identificación fiscal">
            <div className="flex gap-2">
              <select value={taxIdType} onChange={e => setTaxIdType(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-sm bg-[#060a12] border border-[#0f2038] text-white focus:border-[#3b82f6] outline-none transition-colors w-36 shrink-0">
                {TAX_ID_TYPES.map(t => <option key={t} value={t} className="bg-[#060a12]">{t}</option>)}
              </select>
              <input value={taxId} onChange={e => setTaxId(e.target.value)}
                placeholder={taxIdType === 'NIT' ? '900.123.456-7' : 'Número de identificación'}
                className={inputClass()} />
            </div>
          </Field>

          <Field label="Precio mensual (COP)" hint="Valor en pesos colombianos que verá el cliente al pagar">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#475569]">$</span>
              <input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(parseInt(e.target.value) || 0)}
                min={0} className={`${inputClass()} pl-6`} placeholder="0" />
            </div>
            <p className="text-[10px] text-[#3b82f6] mt-1">
              {monthlyPrice > 0 ? `El cliente pagará ${formatCOP(monthlyPrice)} / mes` : 'Sin precio = plan gratuito'}
            </p>
          </Field>

          {error && <ErrorBanner msg={error} />}

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setConfirmDel(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#475569] hover:text-[#f87171] hover:bg-[#ef4444]/8 rounded-xl transition-all">
              <Trash2 className="w-3.5 h-3.5" />Eliminar cliente
            </button>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-[#475569] hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ─── Shared UI primitives ─────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass rounded-2xl border border-[#1e3a5f] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#0f2038]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">{title}</h2>
              <p className="text-[10px] text-[#475569]">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#334155] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[#1e3a5f] mt-1">{hint}</p>}
    </div>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-[#f87171] text-xs bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-3 py-2.5">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}
    </div>
  )
}

function SuccessState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <CheckCircle className="w-12 h-12 text-[#22c55e]" />
      <p className="text-white font-semibold">{message}</p>
      {sub && <p className="text-xs text-[#475569] text-center">{sub}</p>}
    </div>
  )
}

/* ─── Main dashboard ───────────────────────────────────────────────────── */
export function MsspDashboard({ orgs }: Props) {
  const router = useRouter()
  const [search,    setSearch]    = useState('')
  const [showNew,   setShowNew]   = useState(false)
  const [editOrg,   setEditOrg]   = useState<Org | null>(null)

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  const totalEvents    = orgs.reduce((s, o) => s + o.stats.events,  0)
  const totalThreats   = orgs.reduce((s, o) => s + o.stats.threats, 0)
  const orgsWithAlerts = orgs.filter(o => o.stats.alerts > 0).length
  const totalAlerts    = orgs.reduce((s, o) => s + o.stats.alerts,  0)

  function refresh() { router.refresh() }

  return (
    <>
      {showNew && <NewClientModal onClose={() => setShowNew(false)} onCreated={refresh} />}
      {editOrg  && <EditClientModal org={editOrg} onClose={() => setEditOrg(null)} onSaved={refresh} />}

      <div className="space-y-5 max-w-6xl mx-auto">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Organizaciones',       value: orgs.length,     icon: Building2,     color: '#60a5fa' },
            { label: 'Eventos (24h)',         value: totalEvents,     icon: Activity,      color: '#a78bfa' },
            { label: 'Amenazas (24h)',        value: totalThreats,    icon: TrendingUp,    color: '#fbbf24' },
            { label: 'Clientes con alertas',  value: orgsWithAlerts,  icon: AlertTriangle, color: '#f87171' },
          ].map((kpi, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <kpi.icon className="w-4 h-4 mb-3" style={{ color: kpi.color }} />
              <p className="text-2xl font-bold text-white">{kpi.value.toLocaleString('es-CO')}</p>
              <p className="text-xs text-[#475569] mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar organización..."
              className="w-full bg-[#060a12] border border-[#0f2038] focus:border-[#3b82f6] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-[#334155] outline-none transition-colors" />
          </div>

          {totalAlerts > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20">
              <AlertTriangle className="w-3.5 h-3.5 text-[#f87171]" />
              <span className="text-xs font-medium text-[#f87171]">
                {totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''} en {orgsWithAlerts} cliente{orgsWithAlerts !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-xl text-sm transition-all ml-auto">
            <Plus className="w-4 h-4" />Nuevo cliente
          </button>
        </div>

        {/* Lista */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0f2038] flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#3b82f6] to-[#8b5cf6]" />
            <h2 className="font-bold text-white text-sm">Organizaciones gestionadas</h2>
            <span className="ml-auto text-[10px] text-[#334155] font-mono">{filtered.length} / {orgs.length}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-8 h-8 text-[#1e3a5f] mx-auto mb-3" />
              <p className="text-[#334155] text-sm">
                {orgs.length === 0 ? 'Aún no hay clientes. Crea el primero.' : 'No se encontraron organizaciones'}
              </p>
              {orgs.length === 0 && (
                <button onClick={() => setShowNew(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-xl text-sm transition-all">
                  <Plus className="w-4 h-4" />Crear primer cliente
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#0a1628]">
              {filtered.map(org => {
                const hasAlerts = org.stats.alerts > 0
                const isActive  = org.stats.events > 0
                return (
                  <div key={org.id} className="px-5 py-4 hover:bg-[#0d1a2e]/40 transition-colors group">
                    <div className="flex items-center gap-4">

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0f2038] border border-[#1e3a5f] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-[#3b82f6]" />
                      </div>

                      {/* Name + plan */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{org.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${PLAN_STYLE[org.plan] ?? PLAN_STYLE.free}`}>
                            {org.plan}
                          </span>
                          {hasAlerts && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#f87171] font-bold">
                              {org.stats.alerts} alerta{org.stats.alerts !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#475569] mt-0.5 font-mono">
                          {org.slug}
                          {org.tax_id && <span className="ml-2 text-[#334155]">· {org.tax_id_type} {org.tax_id}</span>}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 shrink-0">
                        <Stat label="Eventos 24h" value={org.stats.events.toLocaleString('es-CO')} color="white" />
                        <Stat label="Amenazas" value={org.stats.threats.toLocaleString('es-CO')} color={org.stats.threats > 0 ? '#fbbf24' : '#334155'} />
                        <Stat label="Usuarios" value={String(org.stats.members)} color="#60a5fa" />
                        <Stat label="Precio/mes"
                          value={org.monthly_price > 0 ? formatCOP(org.monthly_price) : 'Gratis'}
                          color={org.monthly_price > 0 ? '#34d399' : '#334155'} />
                        <div className="text-center">
                          <p className={`text-xs font-bold ${org.subscription?.status === 'active' ? 'text-[#22c55e]' : 'text-[#475569]'}`}>
                            {org.subscription?.status === 'active' ? '✓ Al día' : 'Sin pago'}
                          </p>
                          <p className="text-[10px] text-[#334155]">Suscripción</p>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status dot */}
                        {hasAlerts ? (
                          <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef4444]" />
                          </span>
                        ) : (
                          <div className={`w-2 h-2 rounded-full mr-1 ${isActive ? 'bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-[#334155]'}`} />
                        )}

                        {/* Botón editar */}
                        <button
                          onClick={() => setEditOrg(org)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e3a5f]/40 hover:bg-[#3b82f6]/20 text-[#475569] hover:text-[#60a5fa] text-xs"
                        >
                          <Pencil className="w-3 h-3" />
                          <span className="hidden lg:inline">Editar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-[#1e3a5f] text-center">
          Panel exclusivo para rol <strong className="text-[#334155]">super_admin</strong> · BC Security proveedor MSSP
        </p>
      </div>
    </>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#334155]">{label}</p>
    </div>
  )
}
