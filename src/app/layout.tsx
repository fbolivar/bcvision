import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BCVision — Firewall Analytics Platform',
  description: 'Plataforma SaaS de análisis de firewall y ciberseguridad en tiempo real para empresas colombianas. Dashboard, alertas, compliance PCI DSS / ISO 27001 y reportes ejecutivos PDF.',
  icons: {
    icon:     [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple:    '/icon.svg',
  },
  openGraph: {
    title:       'BCVision — Firewall Analytics Platform',
    description: 'Visibilidad total de tu red. Alertas, compliance y reportes en tiempo real.',
    siteName:    'BCVision',
    type:        'website',
  },
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
