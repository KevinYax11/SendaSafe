'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { categories, maxSearchLength, type Category, type Country, type DirectoryCountry, type DirectoryResults } from '../shared/directory'
import { countryCode } from '../shared/forms'
import { filterResources } from '../shared/search-resources'
import { CityChoices } from './city-choices'
import { getResourcesUrl, loadResources } from './directory-api'
import { cityLabel, cityResources, exactCities, loadCountryGeography, rankResources, suggestCities, type City, type Geography, type Point } from './directory-geography'
import { Guidance } from './guidance'
import { InstallApp } from './install-app'
import { readSavedDirectory, refreshSavedDirectories, saveDirectory } from './offline-directory'
import { ResourceCard } from './resource-card'
import { SectionHeader } from './section-header'
import { countryAt, devicePosition, loadWorld } from './world-geography'

type RequestState = {
  url: string
  attempt: number
  result: DirectoryResults | null
  savedAt?: string
}
const savedDate = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

const categoryCodes = Object.keys(categories) as Category[]

export function Directory({ countries }: Readonly<{ countries: DirectoryCountry[] }>) {
  const [country, setCountry] = useState<Country | ''>('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [attempt, setAttempt] = useState(0)
  const [request, setRequest] = useState<RequestState | null>(null)
  const [origin, setOrigin] = useState<Point | null>(null)
  const [locationStatus, setLocationStatus] = useState('')
  const [locating, setLocating] = useState(false)
  const locationRequest = useRef(0)
  const [geography, setGeography] = useState<{ country: Country; index: Geography | null } | null>(null)
  const [cityChoice, setCityChoice] = useState<City | null>(null)
  const [download, setDownload] = useState<{ country: Country; savedAt?: string; error?: string; pending?: boolean } | null>(null)
  const selectedCountry = countries.find(option => option.code === country)
  const availableCountries = countries.filter(option => option.hasCoverage)
  const search = useDeferredValue(query).trim()
  const url = selectedCountry?.hasCoverage ? getResourcesUrl(selectedCountry.code, '', '') : null
  const currentRequest = request?.url === url && request.attempt === attempt ? request : null
  const resources = currentRequest?.result?.resources
  const places = geography?.country === country ? geography.index : null
  const exact = useMemo(() => places && search ? exactCities(places, search) : [], [places, search])
  const city = cityChoice ?? (exact.length === 1 ? exact[0] : null)
  const suggestions = useMemo(() => places && search && !city ? suggestCities(places, search) : [], [places, search, city])
  const results = useMemo(() => resources && filterResources(resources, category || undefined, search), [resources, category, search])
  const rankedResults = useMemo(() => results ? rankResources(results, places, origin) : [], [results, places, origin])
  const cityMatches = useMemo(() => city && places && resources ? cityResources(resources, category || undefined, places, city) : null,
    [city, places, resources, category])
  const saved = download?.country === country ? download : null

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (!active) return
      try {
        const requested = countryCode(new URLSearchParams(location.search).get('country'))
        const last = requested ?? countryCode(localStorage.getItem('sendasafe-country'))
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
    if (!country) return
    const controller = new AbortController()
    void loadCountryGeography(country, controller.signal).then(index => {
      if (!controller.signal.aborted) setGeography({ country, index })
    })
    return () => controller.abort()
  }, [country, attempt])

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
    locationRequest.current += 1
    try { localStorage.setItem('sendasafe-country', value) } catch { /* Optional preference. */ }
    setCountry(value)
    setQuery('')
    setCategory('')
    setCityChoice(null)
    setOrigin(null)
    setLocationStatus('')
    setLocating(false)
    setAttempt(value => value + 1)
  }

  function applyCategory(value: Category | '') {
    setCategory(value)
    setQuery('')
    setCityChoice(null)
  }

  async function locate() {
    const id = ++locationRequest.current
    setLocating(true)
    setLocationStatus('Solicitando permiso de ubicación…')
    try {
      const [point, world] = await Promise.all([devicePosition(), loadWorld()])
      if (id !== locationRequest.current) return
      const matched = countryAt(world, point, 4)
      const option = countries.find(entry => entry.code === matched && entry.hasCoverage)
      if (!option) {
        setLocationStatus(matched ? `Aún no tenemos directorio para ${world[matched][0]}.`
          : 'No pudimos identificar el país. Puedes elegirlo manualmente.')
        return
      }
      selectCountry(option.code)
      setOrigin(point)
      setLocationStatus(`Ubicación aplicada en ${option.name}. Los recursos con municipio aparecen ordenados por distancia.`)
    } catch (error) {
      if (id === locationRequest.current) setLocationStatus(error instanceof Error ? error.message : 'Ubicación no disponible.')
    } finally {
      if (id === locationRequest.current) setLocating(false)
    }
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
              <h1 id="title">Encuentra ayuda<br className="desktop-break" /> <span className="hero-location">donde estás.</span></h1>
              <p>Contactos de emergencia, salud y apoyo para personas migrantes en Latinoamérica.</p>
            </div>

            <div className="country-panel">
              <label htmlFor="country">¿En qué país estás ahora?</label>
              <select id="country" value={country} onChange={event => selectCountry(event.target.value as Country | '')}>
                <option value="">Selecciona un país</option>
                {countries.map(option => (
                  <option value={option.code} key={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
              {selectedCountry?.hasEmergencyResources ? (
                <a className="emergency-link" href="#resultados" onClick={() => applyCategory('emergency')}>
                  Ver emergencias en {selectedCountry.name}
                </a>
              ) : null}
              <div className="offline-tools">
                <button className="feature-button secondary" type="button" disabled={locating} onClick={() => void locate()}>Usar mi ubicación</button>
                {locationStatus && <p role="status">{locationStatus}</p>}
              </div>
              {country && selectedCountry?.hasCoverage && process.env.NODE_ENV === 'production' && (
                <div className="offline-tools" id="guardar-directorio" tabIndex={-1}>
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
            <h2 className="directory-heading" id="directory-title" tabIndex={-1}>{selectedCountry ? `Directorio de ${selectedCountry.name}` : 'Elige un país'}</h2>

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
                      <input id="search" type="search" placeholder="Municipio, entidad o servicio" maxLength={maxSearchLength} value={query} onChange={event => {
                        setCityChoice(null)
                        setQuery(event.target.value)
                      }} />
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
                    <a className="feature-button secondary" href={`/map?country=${selectedCountry.code}`}>Ver en el mapa</a>
                  </div>
                  <CityChoices cities={suggestions} onChoose={choice => {
                    setCityChoice(choice)
                    setQuery(cityLabel(choice))
                  }} />
                </div>
                <div id="resultados" tabIndex={-1}>
                  <p className="result-count" role="status">
                    {!currentRequest && 'Cargando recursos…'}
                    {city && cityMatches ? `Resultados para ${cityLabel(city)}` : results
                      && (results.length === 1 ? '1 recurso disponible' : `${results.length} recursos disponibles`)}
                  </p>
                  {currentRequest?.savedAt && <p className="feature-notice">Copia sin conexión del {savedDate.format(new Date(currentRequest.savedAt))}. Los contactos pueden haber cambiado.</p>}
                  {currentRequest?.result === null && (
                    <div className="message">
                      <p role="alert">No pudimos cargar los recursos. Conéctate para descargar el directorio si aún no tienes una copia.</p>
                      <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
                    </div>
                  )}
                  {cityMatches && city && (
                    <div className="city-results">
                      {!cityMatches.local.length && <p className="feature-notice">Aún no tenemos una ficha local de {city.name} con estos filtros.</p>}
                      {([
                        ['En el municipio', cityMatches.local],
                        ['Recursos más cercanos', cityMatches.nearby],
                        ['Cobertura regional o nacional', cityMatches.coverage],
                      ] as const).map(([heading, entries]) => entries.length > 0 && (
                        <section key={heading}>
                          <h3>{heading}</h3>
                          <div className="resource-grid">
                            {entries.map(({ resource, distance }) => <ResourceCard key={resource.id} resource={resource} distance={distance} />)}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                  {!cityMatches && results && results.length > 0 && (
                    <>
                      {origin && (
                        <div className="feature-row proximity-note">
                          <p>Distancia aproximada en línea recta hasta el centro del municipio.</p>
                          <button className="feature-button secondary" type="button" onClick={() => {
                            setOrigin(null)
                            setLocationStatus('')
                          }}>Quitar ubicación</button>
                        </div>
                      )}
                      <div className="resource-grid">
                        {rankedResults.map(({ resource, distance }) => <ResourceCard key={resource.id} resource={resource} distance={distance} />)}
                      </div>
                    </>
                  )}
                  {!cityMatches && results?.length === 0 && (
                    <div className="message">
                      <p>No encontramos coincidencias. Puedes elegir una ciudad sugerida o usar el mapa para ubicar recursos cercanos.</p>
                      <button type="button" onClick={() => applyCategory('')}>Quitar filtros</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <Guidance country={selectedCountry} showEmergencies={() => applyCategory('emergency')} />
      </main>

      <footer className="site-footer">
        <div className="shell feature-row"><span>SendaSafe</span><a href="/admin">Administración</a></div>
      </footer>
    </>
  )
}
