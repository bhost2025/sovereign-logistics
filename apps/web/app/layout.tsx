import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'Sovereign Logistics',
  description: 'Sistema de rastreo de contenedores China → México',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={manrope.variable}>
      <body className="font-manrope bg-[#f7fafc] text-[#181c1e]">{children}</body>
    </html>
  )
}
