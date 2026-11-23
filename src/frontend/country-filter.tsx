'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { Country } from '../shared/directory'
import { countries } from '../shared/directory'

export function CountryFilter({ action, country, view }: { action: string; country: Country | null; view?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function changeCountry(code: string) {
    if (!view || !code || code === country) return
    const query = new URLSearchParams({ country: code, view })
    startTransition(() => router.push(`${action}?${query}`, { scroll: false }))
  }

  return (
    <form action={action} method="get" className="country-filter">
      {view && <input type="hidden" name="view" value={view} />}
      <label>
        <span>{view ? 'País del panel' : '¿Desde qué país participas?'}</span>
        <select name="country" defaultValue={country ?? ''} required disabled={pending}
          onChange={view ? event => changeCountry(event.target.value) : undefined}>
          <option value="" disabled>Selecciona un país</option>
          {Object.entries(countries).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </label>
      {view ? (
        <>
          <noscript><button className="feature-button" type="submit">Cambiar país</button></noscript>
          <span role="status" className="feature-muted">{pending ? 'Cargando país…' : ''}</span>
        </>
      ) : <button className="feature-button" type="submit">Ver comunidad</button>}
    </form>
  )
}
