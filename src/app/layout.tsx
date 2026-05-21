import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FirewallIQ — Firewall Analytics Platform',
  description: 'Plataforma SaaS multi-tenant para análisis de logs de firewalls en tiempo real',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#0f1117] text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
