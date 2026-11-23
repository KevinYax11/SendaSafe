'use client'

import dynamic from 'next/dynamic'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { categories, maxSearchLength, type Category, type Country, type DirectoryCountry, type DirectoryResults } from '../shared/directory'
import { countryCode } from '../shared/forms'
import { filterResources } from '../shared/search-resources'
import { getResourcesUrl, loadResources } from './directory-api'
import { orderResources, type Boundary, type Municipality, type Point } from './directory-geography'
import { InstallApp } from './install-app'
import { readSavedDirectory, refreshSavedDirectories, saveDirectory } from './offline-directory'
import { ResourceCard } from './resource-card'
import { SectionHeader } from './section-header'

type RequestState = {
  url: string
  attempt: number
  result: DirectoryResults | null
  savedAt?: string
}
type Geography = { country: Country; places: Municipality[]; boundaries: Boundary[] }
const savedDate = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

const categoryCodes = Object.keys(categories) as Category[]
const DirectoryMap = dynamic(() => import('./directory-map').then(module => module.DirectoryMap), {
  ssr: false,
  loading: () => <p className="map-loading" role="status">Cargando mapa…</p>,
})

export function Directory({ countries }: Readonly<{ countries: DirectoryCountry[] }>) {
  const [country, setCountry] = useState<Country | ''>('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [attempt, setAttempt] = useState(0)
  const [request, setRequest] = useState<RequestState | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [origin, setOrigin] = useState<Point | null>(null)
  const [geography, setGeography] = useState<Geography | null>(null)
  const [download, setDownload] = useState<{ country: Country; savedAt?: string; error?: string; pending?: boolean } | null>(null)
  const selectedCountry = countries.find(option => option.code === country)
  const availableCountries = countries.filter(option => option.hasCoverage)
  const search = useDeferredValue(query).trim()
  const url = selectedCountry?.hasCoverage ? getResourcesUrl(selectedCountry.code, '', '') : null
  const currentRequest = request?.url === url && request.attempt === attempt ? request : null
  const resources = currentRequest?.result?.resources
  const results = useMemo(() => resources && filterResources(resources, category || undefined, search), [resources, category, search])
  const map = geography?.country === country ? geography : null
  const places = map?.places ?? []
  const rankedResults = results ? orderResources(results, places, origin) : []
  const saved = download?.country === country ? download : null

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (!active) return
      try {
        const last = countryCode(localStorage.getItem('sendasafe-country'))
        if (last) setCountry(previous => previous || last)
      } catch { /* The directory also works with storage disabled. */ }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    function reconnect() {
      void refreshSavedDirectories().then(() => setAttempt(previous => previous + 1))
    }
    window.addEventListener('online', reconnect)
    return () => window.removeEventListener('online', reconnect)
  }, [])

  useEffect(() => {
    if (!country) return
    let active = true
    void readSavedDirectory(country).then(data => {
      if (active) setDownload(previous => previous?.country === country && previous.pending ? previous : { country, savedAt: data?.savedAt })
    })
    return () => { active = false }
  }, [country, attempt])

  useEffect(() => {
    if (!showMap || !country) return
    const controller = new AbortController()
    void fetch(`/api/v1/geography/${country}`, { signal: controller.signal })
      .then(async response => response.ok ? await response.json() as Omit<Geography, 'country'> : null)
      .catch(() => null)
      .then(data => {
        if (!controller.signal.aborted) setGeography({ country, places: data?.places ?? [], boundaries: data?.boundaries ?? [] })
      })
    return () => controller.abort()
  }, [showMap, country])

  useEffect(() => {
    if (!url || !country) return

    const controller = new AbortController()
    async function load(url: string, country: Country) {
      try {
        const result = await loadResources(url, controller.signal)
        if (!controller.signal.aborted) setRequest({ url, attempt, result })
      } catch {
        if (controller.signal.aborted) return
        const stored = await readSavedDirectory(country)
        if (controller.signal.aborted) return
        setRequest({
          url, attempt,
          result: stored?.result ?? null,
          savedAt: stored?.savedAt,
        })
      }
    }
    void load(url, country)
    return () => controller.abort()
  }, [url, attempt, country])

  function selectCountry(value: Country | '') {
    try { localStorage.setItem('sendasafe-country', value) } catch { /* Optional preference. */ }
    setCountry(value)
    setQuery('')
    setCategory('')
    setShowMap(false)
    setOrigin(null)
    setAttempt(value => value + 1)
  }

  function applyCategory(value: Category | '') {
    setCategory(value)
    setQuery('')
  }

  async function downloadCountry(code: Country) {
    setDownload(previous => ({ country: code, savedAt: previous?.country === code ? previous.savedAt : undefined, pending: true }))
    try {
      const copy = await saveDirectory(code)
      setDownload(previous => previous?.country === code ? { country: code, savedAt: copy.savedAt } : previous)
    } catch {
      setDownload(previous => previous?.country === code
        ? { ...previous, pending: false, error: 'No pudimos guardar el directorio. Comprueba tu conexión y el almacenamiento del navegador.' }
        : previous)
    }
  }

  return (
    <>
      <SectionHeader active="home" />

      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="title">
          <div className="shell intro">
            <div className="intro-copy">
              <h1 id="title">Encuentra ayuda<br className="desktop-break" /> donde estás.</h1>
              <p>Contactos de emergencia, salud y apoyo para personas migrantes en Latinoamérica.</p>
            </div>

            <div className="country-panel">
              <label htmlFor="country">¿En qué país estás ahora?</label>
              <select id="country" value={country} onChange={event => selectCountry(event.target.value as Country | '')}>
                <option value="">Selecciona un país</option>
                {countries.map(option => (
                  <option value={option.code} key={option.code}>
                    {option.hasCoverage ? `${option.name} · con directorio` : option.name}
                  </option>
                ))}
              </select>
              {selectedCountry?.hasEmergencyResources ? (
                <a className="emergency-link" href="#resultados" onClick={() => applyCategory('emergency')}>
                  Ver emergencias en {selectedCountry.name}
                </a>
              ) : (
                <p>Puedes cambiar de país en cualquier momento.</p>
              )}
              {country && selectedCountry?.hasCoverage && process.env.NODE_ENV === 'production' && (
                <div className="offline-tools">
                  <button type="button" className="feature-button secondary" disabled={saved?.pending} onClick={() => void downloadCountry(country)}>
                    {saved?.pending ? 'Guardando…' : saved?.savedAt ? 'Actualizar copia sin conexión' : 'Descargar para usar sin conexión'}
                  </button>
                  <p role="status">{saved?.error ?? (saved?.savedAt ? `Guardado el ${savedDate.format(new Date(saved.savedAt))}.` : '')}</p>
                </div>
              )}
              <InstallApp />
            </div>
          </div>
        </section>

        <section className="directory-section" id="directorio" aria-labelledby="directory-title" tabIndex={-1}>
          <div className="shell">
            <h2 className="directory-heading" id="directory-title" tabIndex={-1}>{selectedCountry ? `Directorio de ${selectedCountry.name}` : 'Países con directorio'}</h2>

            {!selectedCountry && (
              <ul className="coverage-list">
                {availableCountries.map(option => (
                  <li key={option.code}>
                    <button type="button" onClick={() => {
                      selectCountry(option.code)
                      document.getElementById('directory-title')?.focus()
                    }}>
                      {option.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedCountry && !selectedCountry.hasCoverage && (
              <div className="message">
                <p role="status">Aún no tenemos contactos verificados para {selectedCountry.name}.</p>
                <a href="#orientacion">Ver orientación general</a>
              </div>
            )}

            {selectedCountry?.hasCoverage && (
              <>
                <div className="search-panel">
                  <div className="filters">
                    <div>
                      <label htmlFor="search">Buscar recursos</label>
                      <input id="search" type="search" placeholder="Municipio, entidad o servicio" maxLength={maxSearchLength} value={query} onChange={event => setQuery(event.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="category">Tipo de ayuda</label>
                      <select id="category" value={category} onChange={event => setCategory(event.target.value as Category | '')}>
                        <option value="">Todas las categorías</option>
                        {categoryCodes.map(code => (
                          <option value={code} key={code}>{categories[code]}</option>
                        ))}
                      </select>
                    </div>
                    <button className="map-toggle" type="button" aria-expanded={showMap} aria-controls="directory-map" onClick={() => setShowMap(open => !open)}>
                      {showMap ? 'Ocultar mapa' : 'Buscar en el mapa'}
                    </button>
                  </div>
                  <div id="directory-map" hidden={!showMap}>
                    {(showMap || origin) && map && places.length > 0 && (
                      <DirectoryMap key={selectedCountry.code} country={selectedCountry.code} places={places} boundaries={map.boundaries} origin={origin} onOriginChange={setOrigin} />
                    )}
                    {showMap && (!map || places.length === 0) && <p className="map-loading" role="status">
                      {!map ? 'Cargando mapa…' : 'El mapa no está disponible para este país. Puedes buscar por municipio.'}
                    </p>}
                  </div>
                </div>
                <div id="resultados" tabIndex={-1}>
                  <p className="result-count" role="status">
                    {!currentRequest && 'Cargando recursos…'}
                    {results && (results.length === 1 ? '1 recurso disponible' : `${results.length} recursos disponibles`)}
                  </p>
                  {currentRequest?.savedAt && <p className="feature-notice">Copia sin conexión del {savedDate.format(new Date(currentRequest.savedAt))}. Los contactos pueden haber cambiado.</p>}
                  {currentRequest?.result === null && (
                    <div className="message">
                      <p role="alert">No pudimos cargar los recursos. Conéctate para descargar el directorio si aún no tienes una copia.</p>
                      <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
                    </div>
                  )}
                  {results && results.length > 0 && (
                    <>
                      {origin && (
                        <p className="proximity-note" role="status">
                          {rankedResults[0]?.distance === undefined
                            ? 'Los resultados actuales no tienen un municipio ubicado en el mapa.'
                            : 'Primero aparecen los recursos de los municipios más próximos. Las opciones de cobertura general aparecen después.'}
                        </p>
                      )}
                      <div className="resource-grid">
                        {rankedResults.map(({ resource, distance }) => <ResourceCard key={resource.id} resource={resource} distance={distance} />)}
                      </div>
                    </>
                  )}
                  {results?.length === 0 && (
                    <div className="message">
                      <p>No encontramos recursos con esos filtros.</p>
                      <button type="button" onClick={() => applyCategory('')}>Quitar filtros</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section id="orientacion" className="shell guidance" aria-labelledby="guidance-title" tabIndex={-1}>
          <h2 id="guidance-title">Orientación general</h2>
          <div className="guidance-grid">
            <article>
              <h3>Si necesitas ayuda inmediata</h3>
              <p>Contacta a los servicios de emergencia del lugar donde estás. Si te es posible, indica tu municipio y una referencia cercana.</p>
            </article>
            <article>
              <h3>Antes de ir a un centro</h3>
              <p>Confirma el horario, los documentos requeridos y si necesitas cita. Si buscas un albergue, consulta también si hay cupo.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell feature-row"><span>SendaSafe</span><a href="/admin">Administración</a></div>
      </footer>
    </>
  )
}
