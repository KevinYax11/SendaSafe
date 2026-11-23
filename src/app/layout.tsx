import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'SendaSafe | Directorio de ayuda',
  description: 'Encuentra servicios de emergencia, salud y apoyo para personas migrantes en Latinoamérica.',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
