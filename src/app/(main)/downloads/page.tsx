import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Download, Server, Monitor, Terminal, Shield, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Descargas — BCVision' }

export default async function DownloadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Descargas</h1>
        <p className="text-[#64748b] text-sm mt-1">Appliances virtuales y herramientas para tu infraestructura</p>
      </div>

      {/* bcOS Hero */}
      <div className="glass rounded-2xl p-6 border border-[#1e3a5f] mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/40 to-transparent" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#3b82f6]/8 to-transparent rounded-bl-full" />

        <div className="relative flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#3b82f6]/20">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 6.8V17C28 23.8 22.5 29.2 16 31C9.5 29.2 4 23.8 4 17V6.8L16 2Z" fill="white" fillOpacity=".18"/>
              <path d="M8 17Q16 9.5 24 17Q16 24.5 8 17Z" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="16" cy="17" r="4.5" fill="white"/>
              <circle cx="16" cy="17" r="2.2" fill="#3b82f6"/>
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white">bcOS</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                Disponible
              </span>
            </div>
            <p className="text-sm text-[#64748b] mb-4">
              Virtual appliance ligero basado en Alpine Linux. Recibe Syslog de tus firewalls y reenvía los eventos a BCVision en tiempo real.
              Configurable vía web UI — no requiere conocimientos de Linux.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: Server,  label: 'Recursos',   value: '1 CPU · 512 MB' },
                { icon: Monitor, label: 'Web UI',      value: 'Puerto 80' },
                { icon: Shield,  label: 'Syslog',      value: 'UDP/TCP 514' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#060a12] rounded-xl p-3 border border-[#0f2038]">
                  <Icon className="w-3.5 h-3.5 text-[#3b82f6] mb-1.5" />
                  <div className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider">{label}</div>
                  <div className="text-xs text-white font-medium mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/fbolivar/bcvision/releases/latest/download/bcOS-x86_64.iso"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl text-sm font-semibold transition-colors"
                download
              >
                <Download className="w-4 h-4" />
                Descargar ISO (x86_64)
              </a>
              <a
                href="https://github.com/fbolivar/bcvision/blob/main/bcOS/README.md"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 border border-[#0f2038] hover:border-[#3b82f6]/30 text-[#64748b] hover:text-white rounded-xl text-sm transition-colors"
              >
                Documentación <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick start */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#8b5cf6]" />
          Inicio rápido
        </h3>
        <ol className="space-y-4">
          {[
            {
              n: '1',
              title: 'Descarga la ISO',
              body: 'Descarga bcOS-x86_64.iso y crea una VM en VMware, VirtualBox o Proxmox con 1 CPU y 512MB RAM.',
            },
            {
              n: '2',
              title: 'Bootea la VM',
              body: 'Inicia la VM desde la ISO. bcOS arranca automáticamente en modo live (sin disco). Anota la IP asignada.',
            },
            {
              n: '3',
              title: 'Configura el agente',
              body: 'Abre http://<IP-del-appliance>/ en tu navegador y completa el wizard con la URL de BCVision y tu clave API.',
              link: { label: 'Generar clave API →', href: '/settings?tab=agents' },
            },
            {
              n: '4',
              title: 'Apunta tus firewalls',
              body: 'En cada firewall, configura el destino de Syslog a la IP del appliance en el puerto 514 (UDP o TCP).',
            },
          ].map(step => (
            <li key={step.n} className="flex gap-4">
              <div className="w-7 h-7 rounded-lg bg-[#0f2038] flex items-center justify-center text-xs font-bold text-[#3b82f6] flex-shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{step.title}</div>
                <p className="text-xs text-[#475569] mt-0.5">{step.body}</p>
                {step.link && (
                  <a href={step.link.href} className="text-xs text-[#3b82f6] hover:text-[#60a5fa] mt-1 inline-flex items-center gap-1 transition-colors">
                    {step.link.label}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
