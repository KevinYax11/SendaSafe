import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'SendaSafe',
    short_name: 'SendaSafe',
    description: 'Directorio de servicios de ayuda en Latinoamérica',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#39213f',
    icons: [
      { src: '/icons/sendasafe-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/sendasafe-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/sendasafe-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
