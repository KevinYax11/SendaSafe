'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function homeSection() {
  return window.location.hash === '#orientacion' ? 'guidance' : 'directory'
}

export function SectionHeader({ active }: { active: 'home' | 'community' | 'admin' }) {
  const section = useSyncExternalStore(subscribe, homeSection, () => 'directory')
  const current = active === 'home' ? section : active
  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <header className="site-header">
        <div className="shell header-content">
          <a className="brand" href={active === 'home' ? '#main' : '/'}>
            <span className="brand-mark" aria-hidden="true"><span /></span>
            SendaSafe
          </a>
          <nav aria-label="Navegación principal">
            <a href={active === 'home' ? '#directorio' : '/#directorio'} aria-current={current === 'directory' ? 'location' : undefined}>Directorio</a>
            <a href="/community" aria-current={current === 'community' ? 'page' : undefined}>Comunidad</a>
            <a href={active === 'home' ? '#orientacion' : '/#orientacion'} aria-current={current === 'guidance' ? 'location' : undefined}>Orientación</a>
            {active === 'admin' && <a href="/admin" aria-current="page">Administración</a>}
          </nav>
        </div>
      </header>
    </>
  )
}
