'use client'

import { useState } from 'react'
import { categories, countries, matchesSearch, type Category, type Country, type Resource } from '../lib/directory'
import { ResourceCard } from './resource-card'

type DirectoryProps = {
  catalogs: Partial<Record<Country, Resource[]>>
}

const countryCodes = Object.keys(countries) as Country[]
const categoryCodes = Object.keys(categories) as Category[]

export function Directory({ catalogs }: Readonly<DirectoryProps>) {
  const [country, setCountry] = useState<Country | ''>('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const countryName = country ? countries[country] : ''
  const resources = country ? catalogs[country] : undefined
  const results = resources?.filter(resource => (
    (!category || resource.category === category) && matchesSearch(resource, query)
  ))

  function selectCountry(value: Country | '') {
    setCountry(value)
    setQuery('')
    setCategory('')
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
              {countryCodes.map(code => (
                <option value={code} key={code}>{countries[code]}</option>
              ))}
            </select>
            <p>Puedes cambiar de país en cualquier momento.</p>
          </div>
        </section>

        <section className="directory-section" id="directorio" aria-labelledby="directory-title" tabIndex={-1}>
          <div className="shell">
            <div className="directory-heading">
              <h2 id="directory-title">{countryName ? `Directorio de ${countryName}` : 'Directorio de ayuda'}</h2>
              {resources && (
                <a className="emergency-link" href="#resultados" onClick={() => applyCategory('emergency')}>
                  Ver contactos de emergencia
                </a>
              )}
            </div>

            {!country && <p className="message" role="status">Selecciona tu país para consultar los recursos disponibles. El directorio de Guatemala ya está disponible.</p>}
            {country && !resources && (
              <div className="message">
                <p role="status">Aún no tenemos contactos verificados para {countryName}.</p>
                <a href="#orientacion">Ver orientación general</a>
              </div>
            )}

            {resources && results && (
              <>
                <div className="filters">
                  <div>
                    <label htmlFor="search">Buscar recursos</label>
                    <input id="search" type="search" placeholder="Municipio, entidad o servicio" value={query} onChange={event => setQuery(event.target.value)} />
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
                  <p className="result-count" role="status">{results.length === 1 ? '1 recurso disponible' : `${results.length} recursos disponibles`}</p>
                  {results.length > 0 ? (
                    <div className="resource-grid">
                      {results.map(resource => <ResourceCard key={resource.id} resource={resource} />)}
                    </div>
                  ) : (
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
