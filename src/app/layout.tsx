import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'SendaSafe | Directorio de ayuda',
  description: 'Encuentra servicios de emergencia, salud y apoyo para personas migrantes en Latinoamérica.',
  appleWebApp: { capable: true, title: 'SendaSafe' },
  icons: {
    icon: { url: '/icons/sendasafe.svg', type: 'image/svg+xml' },
    apple: '/icons/sendasafe-180.png',
  },
}

export const viewport: Viewport = { themeColor: '#39213f' }

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
