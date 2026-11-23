'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

type InstallEvent = Event & { prompt: () => Promise<unknown> }

function watchDisplayMode(change: () => void) {
  const mode = window.matchMedia('(display-mode: standalone)')
  mode.addEventListener('change', change)
  return () => mode.removeEventListener('change', change)
}

function runsStandalone() {
  const browser = navigator as Navigator & { standalone?: boolean }
  return browser.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const standalone = useSyncExternalStore(watchDisplayMode, runsStandalone, () => false)

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

  if (standalone) return null

  return (
    <div className="install-tools">
      {installed && <p role="status">SendaSafe se añadió a tu dispositivo.</p>}
      {!installed && <details className="install-guide">
        <summary>Instalar en tu dispositivo</summary>
        {prompt && <button className="feature-button" type="button" onClick={async () => {
          setPrompt(null)
          await prompt.prompt().catch(() => {})
        }}>Instalar SendaSafe</button>}
        <div className="install-platforms">
          <details>
            <summary>Android · Chrome</summary>
            <ol>
              <li>Abre SendaSafe en Chrome y toca el menú de tres puntos.</li>
              <li>Elige <strong>Instalar y crear acceso directo</strong>, <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>, según el menú que aparezca.</li>
              <li>Confirma la instalación y abre SendaSafe desde su nuevo icono.</li>
            </ol>
          </details>
          <details>
            <summary>iPhone o iPad · Safari</summary>
            <ol>
              <li>Abre SendaSafe en Safari y toca <strong>Compartir</strong>. En algunos diseños está dentro del menú de la página.</li>
              <li>Selecciona <strong>Agregar a Inicio</strong> o <strong>Añadir a pantalla de inicio</strong>. Si falta la opción, búscala en <strong>Editar acciones</strong>.</li>
              <li>Activa <strong>Abrir como app web</strong> si aparece y confirma con <strong>Agregar</strong>.</li>
            </ol>
          </details>
          <details>
            <summary>Computadora · Chrome</summary>
            <ol>
              <li>Busca el icono de instalación en la barra de direcciones.</li>
              <li>Si no aparece, abre el menú de Chrome. En <strong>Enviar, guardar y compartir</strong>, elige <strong>Instalar página como aplicación</strong>.</li>
              <li>Confirma y abre SendaSafe desde el menú de aplicaciones de tu equipo.</li>
            </ol>
          </details>
        </div>
        <p>Si abriste SendaSafe desde otra app, abre el enlace directamente en Chrome o Safari para acceder a su menú de instalación.</p>
        <p>Para consultar contactos sin internet, abre la versión instalada, elige tu país y guarda su directorio.</p>
      </details>}
    </div>
  )
}
