'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Copy, Check, Server, RefreshCw, AlertCircle } from 'lucide-react'

interface AgentKey {
  id: string
  name: string
  api_key: string
  active: boolean
  last_seen: string | null
  created_at: string
  device_id: string | null
}

export function AgentsTab({ orgId }: { orgId: string }) {
  const [keys, setKeys]       = useState<AgentKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/agent-keys')
    if (res.ok) setKeys(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createKey() {
    if (!newName.trim()) return
    setCreating(true); setError(null)
    const res = await fetch('/api/agent-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error'); setCreating(false); return }
    setKeys(k => [data, ...k])
    setNewName('')
    setShowForm(false)
    setCreating(false)
  }

  async function deleteKey(id: string) {
    if (!confirm('¿Eliminar esta clave API? Los agentes que la usen dejarán de funcionar.')) return
    await fetch(`/api/agent-keys/${id}`, { method: 'DELETE' })
    setKeys(k => k.filter(x => x.id !== id))
  }

  async function copyKey(key: string, id: string) {
    await navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function timeSince(iso: string | null) {
    if (!iso) return 'Nunca'
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (sec < 60) return 'hace un momento'
    if (sec < 3600) return `hace ${Math.floor(sec / 60)}m`
    if (sec < 86400) return `hace ${Math.floor(sec / 3600)}h`
    return `hace ${Math.floor(sec / 86400)}d`
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-4 h-4 text-[#3b82f6]" />
          <h3 className="text-sm font-bold text-white">Agentes bcOS</h3>
        </div>
        <p className="text-xs text-[#475569] mb-4">
          Genera claves API para autenticar appliances bcOS. Cada clave identifica un sitio o sucursal.
          El agente necesita esta clave para enviar eventos a BCVision.
        </p>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-xl text-[#60a5fa] hover:bg-[#3b82f6]/20 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />Nueva clave API
          </button>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 text-[#f87171] text-xs bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />{error}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createKey()}
                placeholder="Ej: Sede Central, Oficina Bogotá..."
                className="flex-1 bg-[#060a12] border border-[#0f2038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#334155] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 outline-none"
                autoFocus
              />
              <button onClick={createKey} disabled={creating || !newName.trim()}
                className="px-4 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {creating ? '...' : 'Crear'}
              </button>
              <button onClick={() => { setShowForm(false); setNewName(''); setError(null) }}
                className="px-3 py-2.5 border border-[#0f2038] rounded-xl text-[#475569] hover:text-white transition-colors text-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keys list */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="w-5 h-5 text-[#334155] animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-10">
            <Server className="w-8 h-8 text-[#1e3a5f] mx-auto mb-3" />
            <p className="text-sm text-[#475569]">Sin claves API</p>
            <p className="text-xs text-[#334155] mt-1">Crea una clave para conectar tu primer appliance bcOS</p>
          </div>
        ) : (
          <div className="divide-y divide-[#0a1628]">
            {keys.map(k => (
              <div key={k.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-[#0f2038] flex items-center justify-center flex-shrink-0">
                  <Server className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{k.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      k.active ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                               : 'bg-[#475569]/10 text-[#475569] border border-[#475569]/20'
                    }`}>
                      {k.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-mono text-[#334155] truncate max-w-[200px]">
                      {k.api_key.slice(0, 16)}••••••••••••••••
                    </span>
                    <span className="text-xs text-[#1e3a5f]">
                      Último evento: {timeSince(k.last_seen)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyKey(k.api_key, k.id)}
                    className="p-2 rounded-lg text-[#475569] hover:text-white hover:bg-[#0f2038] transition-colors"
                    title="Copiar clave"
                  >
                    {copiedId === k.id
                      ? <Check className="w-4 h-4 text-[#22c55e]" />
                      : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="p-2 rounded-lg text-[#475569] hover:text-[#f87171] hover:bg-[#ef4444]/10 transition-colors"
                    title="Eliminar clave"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How-to */}
      <div className="glass rounded-2xl p-5">
        <h4 className="text-xs font-bold text-[#475569] uppercase tracking-widest mb-3">Cómo usar</h4>
        <ol className="space-y-2 text-xs text-[#475569]">
          <li className="flex gap-2"><span className="text-[#3b82f6] font-bold">1.</span> Descarga la ISO de bcOS desde la sección de descargas.</li>
          <li className="flex gap-2"><span className="text-[#3b82f6] font-bold">2.</span> Crea una VM (1 CPU, 512MB RAM) y bootea desde la ISO.</li>
          <li className="flex gap-2"><span className="text-[#3b82f6] font-bold">3.</span> Accede a la Web UI del agente (puerto 80) y pega la clave API.</li>
          <li className="flex gap-2"><span className="text-[#3b82f6] font-bold">4.</span> Apunta el syslog de tus firewalls a la IP del appliance en el puerto 514.</li>
        </ol>
      </div>
    </div>
  )
}
