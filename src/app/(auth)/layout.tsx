export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060a12] flex overflow-hidden relative">

      {/* Mesh background */}
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute inset-0 grid-pattern opacity-60" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-600/6 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }} />

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative z-10 p-12 border-r border-[#1e2d3d]">
        {/* Logo */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center glow-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] opacity-20 blur-sm animate-glow-pulse" />
          </div>
          <div>
            <div className="font-bold text-white text-xl tracking-tight">FirewallIQ</div>
            <div className="text-[10px] text-[#64748b] tracking-widest uppercase">Security Analytics</div>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div>
            <div className="text-xs font-semibold text-[#3b82f6] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-[#3b82f6]" />
              Plataforma Enterprise
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              <span className="text-white">Visibilidad total.</span>
              <br />
              <span className="gradient-text">Tiempo real.</span>
            </h2>
            <p className="mt-4 text-[#64748b] text-sm leading-relaxed max-w-sm">
              Conecta tus firewalls vía Syslog y obtén análisis de tráfico,
              detección de amenazas y reportes ejecutivos con IA en segundos.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Fabricantes', value: '6+', icon: '🔧', color: 'card-blue' },
              { label: 'Eventos/seg', value: '10K+', icon: '⚡', color: 'card-purple' },
              { label: 'Latencia', value: '<2s', icon: '🎯', color: 'card-cyan' },
              { label: 'Retención', value: '90d', icon: '🗄️', color: 'card-green' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className={`${color} rounded-xl p-4 border hover-card`}>
                <div className="text-lg mb-1">{icon}</div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-[#64748b] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['#3b82f6','#8b5cf6','#22c55e','#f59e0b'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#060a12] flex items-center justify-center text-xs font-bold" style={{ backgroundColor: c + '33', borderColor: c + '66', color: c }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="text-xs text-[#64748b]">
              Equipos de seguridad confían en FirewallIQ
            </div>
          </div>
        </div>

        <p className="text-xs text-[#334155] animate-fade-in" style={{ animationDelay: '0.3s' }}>
          © 2025 FirewallIQ · BC Fabric SAS · Todos los derechos reservados
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        {children}
      </div>
    </div>
  )
}
