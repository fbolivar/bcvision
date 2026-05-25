import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Download, Server, Monitor, Terminal, Shield, ChevronRight, Package, Clock, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Descargas — BCVision' }

export default async function DownloadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Descargas</h1>
        <p className="text-[#64748b] text-sm mt-1">Appliances virtuales para recibir Syslog en tu infraestructura</p>
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
              <h2 className="text-lg font-bold text-white">bcOS — Syslog Agent</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
                v1.2.0
              </span>
            </div>
            <p className="text-sm text-[#64748b] mb-4">
              Virtual appliance basado en Alpine Linux. Recibe Syslog de tus firewalls y reenvía los eventos a BCVision.
              Sin configuración de Linux — web UI incluida en el puerto 80.
            </p>

            {/* Changelog */}
            <div className="mb-5 p-3 bg-[#060a12] rounded-xl border border-[#0f2038]">
              <div className="text-[10px] text-[#475569] font-bold uppercase tracking-wider mb-2">Novedades v1.2.0</div>
              <ul className="space-y-1">
                {[
                  'FortiGate IPSEC: sesiones activas enviadas cada 60s a BCVision',
                  'Acciones FortiGate: dropped y clear_session ahora mapeadas correctamente',
                  'VPN tunnel_name incluido para identificar túneles por nombre',
                  'Fix: duration_sec usa directamente creation_time (segundos activos)',
                  'Nuevas acciones VPN: tunnel-up/down, ssl-login-fail, ike-failed',
                ].map(item => (
                  <li key={item} className="flex items-start gap-1.5 text-[11px] text-[#64748b]">
                    <span className="text-[#3b82f6] mt-px flex-shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: Server,  label: 'Recursos',  value: '1 CPU · 512 MB' },
                { icon: Monitor, label: 'Web UI',     value: 'Puerto 80' },
                { icon: Shield,  label: 'Syslog',     value: 'UDP/TCP 514' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#060a12] rounded-xl p-3 border border-[#0f2038]">
                  <Icon className="w-3.5 h-3.5 text-[#3b82f6] mb-1.5" />
                  <div className="text-[10px] text-[#475569] font-semibold uppercase tracking-wider">{label}</div>
                  <div className="text-xs text-white font-medium mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            {/* Download options */}
            <div className="space-y-3">
              {/* Option A: GitHub Release */}
              <div className="flex items-center gap-3 p-3 bg-[#060a12] rounded-xl border border-[#0f2038]">
                <Download className="w-4 h-4 text-[#3b82f6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">Descargar ISO compilada</div>
                  <div className="text-[10px] text-[#475569] mt-0.5">GitHub Releases · compilada automáticamente por CI</div>
                </div>
                <a
                  href="https://github.com/fbolivar/bcvision/releases/latest"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver releases
                </a>
              </div>

              {/* Option B: Build locally */}
              <div className="flex items-center gap-3 p-3 bg-[#060a12] rounded-xl border border-[#0f2038]">
                <Package className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">Compilar localmente</div>
                  <div className="text-[10px] text-[#475569] mt-0.5">Requiere Docker Desktop · ~5-8 minutos</div>
                </div>
                <a
                  href="https://github.com/fbolivar/bcvision/tree/main/bcOS"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0f2038] hover:border-[#8b5cf6]/40 text-[#64748b] hover:text-white rounded-lg text-xs transition-colors whitespace-nowrap"
                >
                  <ChevronRight className="w-3 h-3" />
                  Instrucciones
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Build locally instructions */}
      <div className="glass rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#8b5cf6]" />
          Compilar la ISO localmente (más rápido)
        </h3>
        <p className="text-xs text-[#475569] mb-4">Con Docker Desktop instalado, ejecuta estos comandos en tu PC:</p>

        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-[#334155] font-bold uppercase tracking-wider mb-1.5">Windows (PowerShell)</div>
            <div className="bg-[#020509] rounded-xl border border-[#0f2038] px-4 py-3 font-mono text-xs text-[#22c55e] space-y-1">
              <div><span className="text-[#475569]"># Clona el repo si no lo tienes</span></div>
              <div>git clone https://github.com/fbolivar/bcvision.git</div>
              <div>cd bcvision\bcOS</div>
              <div>.\build.ps1</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#334155] font-bold uppercase tracking-wider mb-1.5">Linux / macOS</div>
            <div className="bg-[#020509] rounded-xl border border-[#0f2038] px-4 py-3 font-mono text-xs text-[#22c55e] space-y-1">
              <div>git clone https://github.com/fbolivar/bcvision.git</div>
              <div>cd bcvision/bcOS && chmod +x build.sh</div>
              <div>./build.sh</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-[#3b82f6]/8 border border-[#3b82f6]/15 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-[#60a5fa] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#475569]">
              El script genera <span className="text-white font-mono">bcOS/output/bcOS-x86_64.iso</span> (~150 MB).
              Primera vez tarda 5-8 min por la descarga de Alpine Linux.
            </p>
          </div>
        </div>
      </div>

      {/* Quick start */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#34d399]" />
          Inicio rápido — 4 pasos
        </h3>
        <ol className="space-y-4">
          {[
            {
              n: '1', color: '#3b82f6',
              title: 'Genera una clave API',
              body: 'Ve a Ajustes → Agentes bcOS → Nueva clave API. Copia la clave generada.',
              link: { label: 'Ir a Ajustes →', href: '/settings' },
            },
            {
              n: '2', color: '#8b5cf6',
              title: 'Compila o descarga la ISO',
              body: 'Usa el script build.ps1 / build.sh (Docker requerido) o descarga desde GitHub Releases.',
            },
            {
              n: '3', color: '#22c55e',
              title: 'Crea la VM y bootea',
              body: 'VMware / VirtualBox / Proxmox: 2 vCPU, 1 GB RAM, red Bridged. Bootea desde la ISO. Anota la IP.',
            },
            {
              n: '4', color: '#f59e0b',
              title: 'Configura y conecta',
              body: 'Abre http://<IP-VM>/ en el navegador. Ingresa la URL de BCVision y la clave API. Luego apunta el syslog de tus firewalls al puerto 514.',
            },
          ].map(step => (
            <li key={step.n} className="flex gap-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: step.color + '18', color: step.color, border: `1px solid ${step.color}30` }}>
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
