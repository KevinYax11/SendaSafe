'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { DirectoryCountry, DirectoryResults } from '../shared/directory'
import { countryCode } from '../shared/forms'
import { CityChoices } from './city-choices'
import { getResourcesUrl, loadResources } from './directory-api'
import { cityLabel, loadCountryGeography, rankResources, resourceCity, suggestCities, type Geography, type Point } from './directory-geography'
import { MapCanvas, type MapMarker } from './map-canvas'
import { ResourceCard } from './resource-card'
import { SectionHeader } from './section-header'
import { countryAt, devicePosition, loadWorld, type World } from './world-geography'

type MapData = { code: string; directory: DirectoryResults | null; geography: Geography | null }

export function MapExplorer({ countries, initialCountry }: { countries: DirectoryCountry[]; initialCountry: string }) {
  const [world, setWorld] = useState<World | null>(null)
  const [worldError, setWorldError] = useState(false)
  const [selected, setSelected] = useState(initialCountry)
  const [origin, setOrigin] = useState<Point | null>(null)
  const [reference, setReference] = useState('')
  const [zoom, setZoom] = useState(1)
  const [cityQuery, setCityQuery] = useState('')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [locationStatus, setLocationStatus] = useState('')
  const [locating, setLocating] = useState(false)
  const [data, setData] = useState<MapData | null>(null)
  const [attempt, setAttempt] = useState(0)
  const locationRequest = useRef(0)
  const supported = countries.filter(country => country.hasCoverage)
  const country = supported.find(country => country.code === selected)
  const currentData = data?.code === selected ? data : null
  const geography = currentData?.geography ?? null
  const resources = currentData?.directory?.resources
  const coverage = useMemo(() => new Set(countries.filter(option => option.hasCoverage && world?.[option.code])
    .map(option => option.code)), [countries, world])
  const ranked = useMemo(() => resources ? rankResources(resources, geography, origin) : [], [resources, geography, origin])
  const suggestions = geography ? suggestCities(geography, cityQuery) : []
  const markers = useMemo(() => {
    const groups = new Map<string, MapMarker & { resources: Set<string> }>()
    if (!resources || !geography) return []
    for (const resource of resources) {
      const city = resourceCity(resource, geography)
      if (!city) continue
      const existing = groups.get(city.id)
      if (existing) {
        existing.resources.add(resource.id)
        existing.count = existing.resources.size
      } else {
        groups.set(city.id, { ...city, label: cityLabel(city), count: 1, resources: new Set([resource.id]) })
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'))
  }, [geography, resources])
  const activeMarker = markers.find(marker => marker.id === resourceFilter)
  const mappedIds = useMemo(() => new Set(markers.flatMap(marker => [...marker.resources])), [markers])
  const unmappedCount = (resources?.length ?? 0) - mappedIds.size
  const visible = activeMarker ? ranked.filter(entry => activeMarker.resources.has(entry.resource.id))
    : resourceFilter === 'unmapped' ? ranked.filter(entry => !mappedIds.has(entry.resource.id)) : ranked

  useEffect(() => {
    let mounted = true
    void loadWorld().then(result => {
      if (mounted) {
        setWorld(result)
        setWorldError(false)
      }
    }, () => { if (mounted) setWorldError(true) })
    return () => { mounted = false }
  }, [attempt])

  useEffect(() => {
    const code = countryCode(selected)
    if (!code) return
    const controller = new AbortController()
    const signal = controller.signal
    void Promise.all([
      loadResources(getResourcesUrl(code, '', ''), signal).catch(() => null),
      loadCountryGeography(code, signal),
    ]).then(([directory, geography]) => {
      if (!signal.aborted) setData({ code, directory, geography })
    })
    return () => controller.abort()
  }, [selected, attempt])

  function selectCountry(code: string) {
    locationRequest.current += 1
    setLocating(false)
    setLocationStatus('')
    setSelected(code)
    setOrigin(null)
    setReference('')
    setCityQuery('')
    setZoom(1)
    setResourceFilter('all')
  }

  function selectPoint(point: Point, label = 'Punto en el mapa') {
    locationRequest.current += 1
    setLocating(false)
    setLocationStatus('')
    setOrigin(point)
    setReference(label)
    setCityQuery('')
    setResourceFilter('all')
  }

  async function locate() {
    const id = ++locationRequest.current
    setLocating(true)
    setLocationStatus('Solicitando permiso de ubicación…')
    try {
      const [point, boundaries] = await Promise.all([devicePosition(), loadWorld()])
      if (id !== locationRequest.current) return
      const found = countryAt(boundaries, point, 4)
      setSelected(found ?? '')
      setOrigin(point)
      setReference('Tu ubicación')
      setCityQuery('')
      setZoom(1)
      setResourceFilter('all')
      setLocationStatus(found ? `Ubicación aplicada en ${boundaries[found][0]}.`
        : 'No pudimos identificar el país en el mapa. Puedes elegirlo en el selector.')
    } catch (error) {
      if (id === locationRequest.current) setLocationStatus(error instanceof Error ? error.message : 'Ubicación no disponible.')
    } finally {
      if (id === locationRequest.current) setLocating(false)
    }
  }

  return (
    <>
      <SectionHeader active="map" />
      <main id="main" className="shell feature-shell" tabIndex={-1}>
        <div className="feature-intro">
          <h1>Mapa de recursos</h1>
          <p>Elige un país para ver sus contactos. Usa tu ubicación o un municipio para ordenar los recursos más cercanos.</p>
        </div>
        <div className="map-explorer">
          <div className="map-toolbar">
            <label>País o territorio
              <select value={selected} onChange={event => selectCountry(event.target.value)}>
                <option value="">Vista mundial</option>
                {supported.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
                {selected && !country && <option value={selected}>{world?.[selected]?.[0] ?? selected}</option>}
              </select>
            </label>
            <button type="button" className="feature-button" disabled={locating} onClick={() => void locate()}>Usar mi ubicación</button>
            {selected && <button type="button" className="feature-button secondary" onClick={() => selectCountry('')}>Volver al mundo</button>}
          </div>
          <div className="map-frame">
            {world ? <MapCanvas world={world} selected={selected} coverage={coverage} markers={markers} origin={origin}
              activeMarker={activeMarker?.id ?? ''} zoom={zoom} onSelectCountry={selectCountry} onSelectPoint={selectPoint}
              onSelectMarker={id => setResourceFilter(previous => previous === id ? 'all' : id)} /> : (
              <div className="map-placeholder" role="status">
                {worldError ? <><p>No se pudo cargar el mapa.</p><button className="feature-button secondary" type="button"
                  onClick={() => setAttempt(value => value + 1)}>Reintentar</button></> : <p>Cargando mapa…</p>}
              </div>
            )}
            {world && selected && <div className="map-controls">
              <button type="button" disabled={zoom >= 8} aria-label="Acercar" onClick={() => setZoom(value => value * 2)}>+</button>
              <button type="button" disabled={zoom === 1} aria-label="Alejar" onClick={() => setZoom(value => value / 2)}>−</button>
            </div>}
          </div>
          <div className="map-caption">
            <span><i className="map-legend" /> {selected ? 'El número indica cuántas fichas puedes abrir en ese municipio.'
              : 'Países y territorios con directorio'}</span>
            <span>Datos de <a href="https://www.naturalearthdata.com/">Natural Earth</a> y <a href="https://www.geonames.org/">GeoNames</a></span>
          </div>
          {activeMarker && <div className="feature-row map-selection" role="status">
            <span>{activeMarker.label} · {activeMarker.count} {activeMarker.count === 1 ? 'recurso' : 'recursos'}</span>
            <a href="#map-resources">Ver fichas</a>
          </div>}
          {locationStatus && <p className="feature-muted" role="status">{locationStatus}</p>}
        </div>
        {country && <section aria-labelledby="map-resources">
          <div className="feature-row map-results-header">
            <h2 id="map-resources">Recursos de {country.name}</h2>
            <a className="feature-button secondary" href={`/?country=${country.code}#directorio`}>Abrir en el directorio</a>
          </div>
          <div className="map-list-filters">
            {resources && <label>Mostrar recursos
              <select value={activeMarker?.id ?? (resourceFilter === 'unmapped' ? 'unmapped' : 'all')}
                onChange={event => setResourceFilter(event.target.value)}>
                <option value="all">Todos ({resources.length})</option>
                {unmappedCount > 0 && <option value="unmapped">Sin punto en el mapa ({unmappedCount})</option>}
                {markers.map(marker => <option key={marker.id} value={marker.id}>{marker.label} ({marker.count})</option>)}
              </select>
            </label>}
            {geography && <div className="map-city">
              <label>Municipio de referencia
                <input type="search" value={cityQuery} maxLength={100} onChange={event => setCityQuery(event.target.value)}
                  placeholder="Busca una ciudad o municipio" />
              </label>
              <CityChoices cities={suggestions} onChoose={city => selectPoint(city, cityLabel(city))} />
            </div>}
          </div>
          {origin && <div className="feature-row proximity-note">
            <p>Referencia: {reference}. Las distancias son aproximadas, en línea recta hasta el centro del municipio.</p>
            <button className="feature-button secondary" type="button" onClick={() => {
              setOrigin(null)
              setReference('')
              setZoom(1)
              setLocationStatus('')
            }}>Quitar referencia</button>
          </div>}
          <p className="result-count" role="status">{!currentData ? 'Cargando recursos…' : !resources
            ? 'No se pudo cargar el directorio.' : activeMarker
              ? `${visible.length} de ${resources.length} recursos · ${activeMarker.label}`
              : resourceFilter === 'unmapped' ? `${unmappedCount} de ${resources.length} recursos sin punto en el mapa`
                : `${resources.length} recursos en el directorio · ${mappedIds.size} en ${markers.length} municipios del mapa`}</p>
          {resourceFilter === 'unmapped' && unmappedCount > 0 && <p className="feature-notice">
            Estas fichas tienen cobertura regional o nacional, o carecen de un municipio que se pueda ubicar.
          </p>}
          {currentData && !currentData.directory && <button type="button" className="feature-button secondary"
            onClick={() => setAttempt(value => value + 1)}>Reintentar</button>}
          <div className="resource-grid">
            {visible.map(({ resource, distance }) => <ResourceCard key={resource.id} resource={resource} distance={distance} />)}
          </div>
        </section>}
        {selected && !country && <p className="feature-notice">Aún no tenemos directorio para {world?.[selected]?.[0] ?? selected}.</p>}
        <p className="feature-muted">Tu ubicación se usa solo en este navegador.</p>
      </main>
    </>
  )
}
