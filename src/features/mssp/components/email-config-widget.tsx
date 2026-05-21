'use client'

import { useEffect, useState } from 'react'
import { Mail, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'

interface SmtpStatus { ok: boolean; from: string; host: string; port: string; error?: string }

export function EmailConfigWidget() {
  const [status,  setStatus]  = useState<SmtpStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [testTo,  setTestTo]  = useState('')
  const [sending, setSending] = useState(false)
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/email-test')
      .then(r => r.json())
      .then(d => setStatus(d))
      .finally(() => setLoading(false))
  }, [])

  async function handleTest() {
    setSending(true)
    setResult(null)
    const res = await fetch('/api/admin/email-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testTo.trim() || undefined }),
    })
    const data = await res.json()
    setSending(false)
    setResult(res.ok
      ? { ok: true,  msg: `Correo enviado a ${data.to}` }
      : { ok: false, msg: data.error ?? 'Error desconocido' }
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#0f2038] flex items-center gap-2">
        <Mail className="w-4 h-4 text-[#60a5fa]" />
        <h2 className="font-bold text-white text-sm">Servidor de correo</h2>
        <div className="ml-auto">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-[#475569] animate-spin" />
          ) : status?.ok ? (
            <span className="flex items-center gap-1 text-[10px] text-[#22c55e] font-bold">
              <CheckCircle className="w-3 h-3" />CONECTADO
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-[#f87171] font-bold">
              <AlertCircle className="w-3 h-3" />ERROR
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Info SMTP */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Remitente', value: status?.from ?? '—' },
            { label: 'Host',      value: status?.host ?? '—' },
            { label: 'Puerto',    value: status?.port ?? '—' },
          ].map(f => (
            <div key={f.label} className="bg-[#060a12] border border-[#0f2038] rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-[#334155] uppercase tracking-widest font-bold mb-0.5">{f.label}</p>
              <p className="text-xs text-white font-mono truncate">{f.value}</p>
            </div>
          ))}
        </div>

        {status?.error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20">
            <AlertCircle className="w-3.5 h-3.5 text-[#f87171] shrink-0 mt-0.5" />
            <p className="text-xs text-[#f87171]">{status.error}</p>
          </div>
        )}

        {/* Enviar correo de prueba */}
        <div>
          <p className="text-[10px] text-[#334155] uppercase tracking-widest font-bold mb-2">Correo de prueba</p>
          <div className="flex gap-2">
            <input
              value={testTo}
              onChange={e => setTestTo(e.target.value)}
              placeholder="destinatario@empresa.com (vacío = tu correo)"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-[#060a12] border border-[#0f2038] text-white placeholder-[#334155] focus:border-[#3b82f6] outline-none transition-colors"
            />
            <button
              onClick={handleTest}
              disabled={sending || !status?.ok}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all shrink-0"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Enviar
            </button>
          </div>
        </div>

        {result && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium ${
            result.ok
              ? 'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]'
              : 'bg-[#ef4444]/10 border-[#ef4444]/20 text-[#f87171]'
          }`}>
            {result.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {result.msg}
          </div>
        )}
      </div>
    </div>
  )
}
