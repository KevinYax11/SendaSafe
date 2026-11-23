'use client'

import { useEffect, useState } from 'react'

type InstallEvent = Event & { prompt: () => Promise<unknown> }

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/service-worker.js').catch(() => {})
    }
    function offer(event: Event) {
      event.preventDefault()
      setPrompt(event as InstallEvent)
    }
    function complete() {
      setPrompt(null)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', offer)
    window.addEventListener('appinstalled', complete)
    return () => {
      window.removeEventListener('beforeinstallprompt', offer)
      window.removeEventListener('appinstalled', complete)
    }
  }, [])

  return (
    <div className="offline-tools">
      {prompt && <button className="feature-button secondary" type="button" onClick={async () => {
        setPrompt(null)
        await prompt.prompt()
      }}>Instalar SendaSafe</button>}
      {installed && <p role="status">SendaSafe se añadió a tu dispositivo.</p>}
      {!prompt && !installed && <details className="resource-details">
        <summary>Instalar en tu dispositivo</summary>
        <p>Abre el menú del navegador y busca «Instalar» o «Añadir a pantalla de inicio». En iPhone, usa Compartir en Safari y activa «Abrir como app web».</p>
      </details>}
    </div>
  )
}
