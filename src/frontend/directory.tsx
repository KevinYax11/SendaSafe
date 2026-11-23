'use client'

import { useEffect, useState } from 'react'
import { categories, maxSearchLength, type Category, type Country, type DirectoryCountry, type DirectoryResults } from '../shared/directory'
import { getResourcesUrl, loadResources } from './directory-api'
import { ResourceCard } from './resource-card'

type RequestState = {
  url: string
  attempt: number
  result: DirectoryResults | null
}

const categoryCodes = Object.keys(categories) as Category[]
const countryNames = new Intl.ListFormat('es', { type: 'conjunction' })

export function Directory({ countries }: Readonly<{ countries: DirectoryCountry[] }>) {
  const [country, setCountry] = useState<Country | ''>('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [attempt, setAttempt] = useState(0)
  const [request, setRequest] = useState<RequestState | null>(null)
  const selectedCountry = countries.find(option => option.code === country)
  const availableCountries = countries.filter(option => option.hasCoverage).map(option => option.name)
  const search = query.trim()
  const url = selectedCountry?.hasCoverage ? getResourcesUrl(selectedCountry.code, category, search) : null
  const currentRequest = request?.url === url && request.attempt === attempt ? request : null
  const results = currentRequest?.result?.resources

  useEffect(() => {
    if (!url) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const result = await loadResources(url, controller.signal)
        if (!controller.signal.aborted) setRequest({ url, attempt, result })
      } catch {
        if (!controller.signal.aborted) setRequest({ url, attempt, result: null })
      }
    }, search ? 200 : 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [url, search, attempt])

  function selectCountry(value: Country | '') {
    setCountry(value)
    setQuery('')
    setCategory('')
    setAttempt(value => value + 1)
  }

  function applyCategory(value: Category | '') {
    setCategory(value)
    setQuery('')
  }

  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <header className="site-header">
        <div className="shell header-content">
          <a className="brand" href="#main">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            SendaSafe
          </a>
          <nav aria-label="Navegación principal">
            <a href="#directorio">Directorio</a>
            <a href="#orientacion">Orientación</a>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="shell intro" aria-labelledby="title">
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
          </div>
        </section>

        <section className="directory-section" id="directorio" aria-labelledby="directory-title" tabIndex={-1}>
          <div className="shell">
            <h2 className="directory-heading" id="directory-title">{selectedCountry ? `Directorio de ${selectedCountry.name}` : 'Directorio de ayuda'}</h2>

            {!selectedCountry && (
              <p className="message" role="status">
                Selecciona un país para consultar sus recursos. Cobertura disponible en {countryNames.format(availableCountries)}.
              </p>
            )}
            {selectedCountry && !selectedCountry.hasCoverage && (
              <div className="message">
                <p role="status">Aún no tenemos contactos verificados para {selectedCountry.name}.</p>
                <a href="#orientacion">Ver orientación general</a>
              </div>
            )}

            {selectedCountry?.hasCoverage && (
              <>
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
                </div>
                <div id="resultados" tabIndex={-1}>
                  <p className="result-count" role="status">
                    {!currentRequest && 'Cargando recursos…'}
                    {results && (results.length === 1 ? '1 recurso disponible' : `${results.length} recursos disponibles`)}
                  </p>
                  {currentRequest?.result === null && (
                    <div className="message">
                      <p role="alert">No pudimos cargar los recursos.</p>
                      <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
                    </div>
                  )}
                  {results && results.length > 0 && (
                    <div className="resource-grid">
                      {results.map(resource => <ResourceCard key={resource.id} country={selectedCountry.code} resource={resource} />)}
                    </div>
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
        <div className="shell">SendaSafe</div>
      </footer>
    </>
  )
}
