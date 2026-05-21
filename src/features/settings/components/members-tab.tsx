'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Crown, Eye, BarChart2, UserPlus, Loader2, CheckCircle,
  Mail, Pencil, Trash2, X, Save, AlertTriangle, ShieldCheck, KeyRound, EyeOff,
} from 'lucide-react'

interface Member {
  id: string
  full_name: string | null
  email: string
  role: string
  created_at: string
}

interface Props {
  members: Member[]
  isAdmin: boolean
  currentUserId: string
}

const ROLES = ['admin', 'analyst', 'viewer'] as const
type Role = typeof ROLES[number]

const roleConfig: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  admin:   { label: 'Admin',    icon: Crown,    color: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30' },
  analyst: { label: 'Analista', icon: BarChart2, color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
  viewer:  { label: 'Viewer',   icon: Eye,       color: 'text-[#64748b] bg-[#64748b]/10 border-[#64748b]/30' },
}

const roleDescriptions: Record<string, string> = {
  admin:   'Acceso total: configuración, miembros, dispositivos',
  analyst: 'Puede ver datos, crear alertas y generar reportes',
  viewer:  'Solo lectura de dashboards y eventos',
}

function Avatar({ name, email, size = 8 }: { name: string | null; email: string; size?: number }) {
  const initials = (name || email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['from-[#3b82f6] to-[#8b5cf6]', 'from-[#10b981] to-[#06b6d4]', 'from-[#f59e0b] to-[#ef4444]', 'from-[#ec4899] to-[#8b5cf6]']
  const color  = colors[(email.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className={`w-${size} h-${size} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xs font-bold text-white shrink-0 select-none`}>
      {initials}
    </div>
  )
}

export function MembersTab({ members, isAdmin, currentUserId }: Props) {
  const router = useRouter()

  // Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState<Role>('analyst')
  const [invLoading,  setInvLoading]  = useState(false)
  const [invStatus,   setInvStatus]   = useState<'idle' | 'sent' | 'error'>('idle')
  const [invError,    setInvError]    = useState('')

  // Edit
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editName,    setEditName]    = useState('')
  const [editRole,    setEditRole]    = useState<Role>('analyst')
  const [editLoading, setEditLoading] = useState(false)
  const [editError,   setEditError]   = useState('')

  // Delete
  const [deleteId,      setDeleteId]      = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError,   setDeleteError]   = useState('')

  // Password change
  const [pwMemberId,  setPwMemberId]  = useState<string | null>(null)
  const [pwNew,       setPwNew]       = useState('')
  const [pwConfirm,   setPwConfirm]   = useState('')
  const [pwShow,      setPwShow]      = useState(false)
  const [pwLoading,   setPwLoading]   = useState(false)
  const [pwError,     setPwError]     = useState('')
  const [pwDone,      setPwDone]      = useState(false)

  function openPw(id: string) { setPwMemberId(id); setPwNew(''); setPwConfirm(''); setPwError(''); setPwDone(false) }
  function closePw() { setPwMemberId(null) }

  async function handlePwChange() {
    if (pwNew.length < 8)        { setPwError('Mínimo 8 caracteres'); return }
    if (pwNew !== pwConfirm)     { setPwError('Las contraseñas no coinciden'); return }
    setPwLoading(true); setPwError('')
    const res = await fetch(`/api/members/${pwMemberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwNew }),
    })
    const data = await res.json()
    if (!res.ok) { setPwError(data.error ?? 'Error al cambiar contraseña') }
    else         { setPwDone(true) }
    setPwLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInvLoading(true)
    setInvError('')
    const res = await fetch('/api/members/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      setInvStatus('error')
      setInvError(data.error ?? 'Error al invitar')
    } else {
      setInvStatus('sent')
      setInviteEmail('')
      setTimeout(() => { setInvStatus('idle'); router.refresh() }, 3000)
    }
    setInvLoading(false)
  }

  function startEdit(m: Member) {
    setEditingId(m.id)
    setEditName(m.full_name ?? '')
    setEditRole((m.role as Role) ?? 'analyst')
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  async function handleSave(id: string) {
    setEditLoading(true)
    setEditError('')
    const res = await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editRole, full_name: editName.trim() || null }),
    })
    const data = await res.json()
    if (!res.ok) {
      setEditError(data.error ?? 'Error al guardar')
    } else {
      setEditingId(null)
      router.refresh()
    }
    setEditLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true)
    setDeleteError('')
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setDeleteError(data.error ?? 'Error al eliminar')
      setDeleteLoading(false)
    } else {
      setDeleteId(null)
      setDeleteLoading(false)
      router.refresh()
    }
  }

  const memberToDelete = members.find(m => m.id === deleteId)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Miembros del equipo</h2>
          <p className="text-sm text-[#475569] mt-0.5">{members.length} miembro{members.length !== 1 ? 's' : ''} en la organización</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
          <span className="text-xs font-medium text-[#4ade80]">{members.filter(m => m.role === 'admin').length} admin{members.filter(m => m.role === 'admin').length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Invite (admin only) */}
      {isAdmin && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-sm font-bold text-white">Invitar nuevo miembro</span>
          </div>
          {invStatus === 'sent' ? (
            <div className="flex items-center gap-3 py-3 text-[#4ade80]">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Invitación enviada</p>
                <p className="text-xs text-[#334155] mt-0.5">El usuario recibirá un correo con instrucciones para unirse</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]" />
                  <input
                    type="email" required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    className="w-full bg-[#060a12] border border-[#0f2038] focus:border-[#3b82f6] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-[#334155] outline-none transition-colors"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as Role)}
                  className="bg-[#060a12] border border-[#0f2038] rounded-xl px-3 py-2.5 text-white text-sm w-36 cursor-pointer outline-none"
                >
                  {ROLES.map(r => <option key={r} value={r} className="bg-[#060a12]">{roleConfig[r].label}</option>)}
                </select>
              </div>
              <p className="text-xs text-[#334155]">{roleDescriptions[inviteRole]}</p>
              {invError && <p className="text-xs text-[#ef4444]">{invError}</p>}
              <button type="submit" disabled={invLoading || !inviteEmail}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all">
                {invLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Enviar invitación
              </button>
            </form>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="glass rounded-2xl overflow-hidden">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <Users className="w-8 h-8 text-[#1e3a5f] mb-3" />
            <p className="text-sm text-[#334155]">No hay miembros registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-[#0a1628]">
            {members.map(m => {
              const rc    = roleConfig[m.role] ?? roleConfig.viewer
              const isMe  = m.id === currentUserId
              const isEditing = editingId === m.id

              return (
                <div key={m.id} className={`px-5 py-4 transition-colors ${isEditing ? 'bg-[#0d1a2e]/80' : 'hover:bg-[#0d1a2e]/40'}`}>
                  {isEditing ? (
                    /* ── Edit mode ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-1">
                        <Avatar name={m.full_name} email={m.email} size={8} />
                        <span className="text-xs text-[#475569] font-mono">{m.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1">Nombre</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Nombre completo"
                            className="w-full bg-[#060a12] border border-[#1e3a5f] focus:border-[#3b82f6] rounded-xl px-3 py-2 text-white text-sm placeholder-[#334155] outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1">Rol</label>
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as Role)}
                            className="w-full bg-[#060a12] border border-[#1e3a5f] rounded-xl px-3 py-2 text-white text-sm cursor-pointer outline-none"
                          >
                            {ROLES.map(r => <option key={r} value={r} className="bg-[#060a12]">{roleConfig[r].label}</option>)}
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-[#334155]">{roleDescriptions[editRole]}</p>
                      {editError && <p className="text-xs text-[#ef4444]">{editError}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(m.id)} disabled={editLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all">
                          {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Guardar
                        </button>
                        <button onClick={cancelEdit}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-[#475569] hover:text-white hover:bg-[#0f2038] transition-colors">
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <div className="flex items-center gap-4">
                      <Avatar name={m.full_name} email={m.email} size={9} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">
                            {m.full_name ?? <span className="text-[#475569] italic">Sin nombre</span>}
                          </span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#60a5fa] font-bold">tú</span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${rc.color}`}>
                            <rc.icon className="w-2.5 h-2.5" />
                            {rc.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] mt-0.5">{m.email}</p>
                        <p className="text-[10px] text-[#1e3a5f] mt-0.5">
                          Miembro desde {new Date(m.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {isAdmin && !isMe && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => startEdit(m)}
                            className="p-2 rounded-xl text-[#475569] hover:text-white hover:bg-[#1e3a5f] transition-colors"
                            title="Editar nombre y rol">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openPw(m.id)}
                            className="p-2 rounded-xl text-[#475569] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors"
                            title="Cambiar contraseña">
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setDeleteId(m.id); setDeleteError('') }}
                            className="p-2 rounded-xl text-[#475569] hover:text-[#f87171] hover:bg-[#ef4444]/10 transition-colors"
                            title="Eliminar miembro">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!isAdmin && (
        <p className="text-xs text-[#1e3a5f] text-center">
          Contacta a un administrador para invitar o gestionar miembros.
        </p>
      )}

      {/* Password change modal */}
      {pwMemberId && (() => {
        const pwMember = members.find(m => m.id === pwMemberId)
        if (!pwMember) return null
        return (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closePw} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="glass rounded-2xl border border-[#f59e0b]/30 w-full max-w-md p-6 shadow-2xl"
                style={{ boxShadow: '0 0 40px rgba(245,158,11,0.12)' }}>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/25 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-[#fbbf24]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Cambiar contraseña</h3>
                    <p className="text-sm text-[#475569] mt-0.5">
                      {pwMember.full_name ?? pwMember.email}
                    </p>
                  </div>
                  <button onClick={closePw} className="p-1.5 rounded-lg text-[#475569] hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {pwDone ? (
                  <div className="flex items-center gap-3 py-4 text-[#4ade80]">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Contraseña actualizada</p>
                      <p className="text-xs text-[#334155] mt-0.5">El usuario puede iniciar sesión con la nueva contraseña.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Nueva contraseña</label>
                      <div className="relative">
                        <input
                          type={pwShow ? 'text' : 'password'}
                          value={pwNew}
                          onChange={e => setPwNew(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          className="w-full bg-[#060a12] border border-[#0f2038] focus:border-[#f59e0b] rounded-xl px-3 py-2.5 pr-10 text-white text-sm placeholder-[#334155] outline-none transition-colors"
                        />
                        <button type="button" onClick={() => setPwShow(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#334155] hover:text-white transition-colors">
                          {pwShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#334155] uppercase tracking-widest mb-1.5">Confirmar contraseña</label>
                      <input
                        type={pwShow ? 'text' : 'password'}
                        value={pwConfirm}
                        onChange={e => setPwConfirm(e.target.value)}
                        placeholder="Repetir contraseña"
                        onKeyDown={e => e.key === 'Enter' && handlePwChange()}
                        className="w-full bg-[#060a12] border border-[#0f2038] focus:border-[#f59e0b] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#334155] outline-none transition-colors"
                      />
                    </div>
                    {pwNew && pwConfirm && pwNew === pwConfirm && (
                      <p className="text-xs text-[#4ade80] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Las contraseñas coinciden
                      </p>
                    )}
                    {pwError && <p className="text-xs text-[#ef4444]">{pwError}</p>}
                    <div className="flex gap-3 pt-1">
                      <button onClick={handlePwChange} disabled={pwLoading || !pwNew || !pwConfirm}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-black font-bold rounded-xl text-sm transition-all">
                        {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        Cambiar contraseña
                      </button>
                      <button onClick={closePw}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:text-white hover:bg-[#0f2038] border border-[#0f2038] transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })()}

      {/* Delete confirmation modal */}
      {deleteId && memberToDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass rounded-2xl border border-[#ef4444]/30 w-full max-w-md p-6 shadow-2xl"
              style={{ boxShadow: '0 0 40px rgba(239,68,68,0.15)' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/25 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#f87171]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">Eliminar miembro</h3>
                  <p className="text-sm text-[#475569] mt-1">
                    ¿Estás seguro de que quieres eliminar a{' '}
                    <strong className="text-white">{memberToDelete.full_name ?? memberToDelete.email}</strong>{' '}
                    de la organización?
                  </p>
                  <p className="text-xs text-[#334155] mt-2">
                    El usuario perderá acceso inmediatamente. Esta acción no puede deshacerse.
                  </p>
                  {deleteError && <p className="text-xs text-[#ef4444] mt-2">{deleteError}</p>}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:text-white hover:bg-[#0f2038] border border-[#0f2038] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
