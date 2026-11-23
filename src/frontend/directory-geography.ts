import type { Category, Country, Resource } from '../shared/directory'
import { filterResources, normalizeSearch } from '../shared/search-resources'

export type Point = { latitude: number; longitude: number }
export type City = Point & { id: string; name: string; region: string; names: string[] }
export type GeographyFile = {
  places: Record<string, [string, string, number, number, string[]]>
  references: Record<string, string>
}
export type Geography = ReturnType<typeof indexGeography>
export type RankedResource = { resource: Resource; distance?: number }

export function geographyUrl(country: Country) {
  return `/geography/${country}.json`
}

export async function loadCountryGeography(country: Country, signal: AbortSignal) {
  const url = geographyUrl(country)
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) return null
    return indexGeography(await response.json())
  } catch {
    if (signal.aborted || typeof caches === 'undefined') return null
    try {
      const saved = await caches.match(url)
      return saved ? indexGeography(await saved.json()) : null
    } catch {
      return null
    }
  }
}

function indexGeography(data: GeographyFile) {
  const byName = new Map<string, City[]>()
  const cities = Object.entries(data.places).map(([id, [name, region, latitude, longitude, aliases]]) => {
    const names = [...new Set([name, ...aliases].map(normalizeSearch))]
    const city = { id, name, region, latitude, longitude, names }
    for (const key of names) {
      const matches = byName.get(key) ?? []
      matches.push(city)
      byName.set(key, matches)
    }
    return city
  })
  return { cities, byName, byId: new Map(cities.map(city => [city.id, city])), references: data.references }
}

export function cityLabel(city: City) {
  return city.region && normalizeSearch(city.name) !== normalizeSearch(city.region)
    ? `${city.name}, ${city.region}` : city.name
}

export function exactCities(geography: Geography, query: string) {
  const key = normalizeSearch(query)
  const exact = geography.byName.get(key)
  return exact ?? geography.cities.filter(city => normalizeSearch(cityLabel(city)) === key)
}

export function suggestCities(geography: Geography, query: string) {
  const key = normalizeSearch(query)
  if (key.length < 2) return []
  return geography.cities.filter(city => city.names.some(name => name.startsWith(key))
    || normalizeSearch(cityLabel(city)).startsWith(key))
    .sort((a, b) => Number(b.names.includes(key)) - Number(a.names.includes(key))
      || a.name.localeCompare(b.name, 'es'))
    .slice(0, 6)
}

export function resourceCity(resource: Resource, geography: Geography) {
  const { scope, municipality, area } = resource.coverage
  if (scope === 'national' || !municipality) return undefined
  const key = normalizeSearch(municipality)
  const location = normalizeSearch(area)
  const id = geography.references[`${key}|${location}`]
  if (id) return geography.byId.get(id)
  const matches = geography.byName.get(key) ?? []
  const regional = matches.filter(city => city.region && includesPlace(location, normalizeSearch(city.region)))
  return regional.length === 1 ? regional[0] : matches.length === 1 ? matches[0] : undefined
}

function includesPlace(coverage: string, place: string) {
  return Boolean(place) && ` ${coverage} `.includes(` ${place} `)
}

export function rankResources(resources: Resource[], geography: Geography | null, origin: Point | null): RankedResource[] {
  const ranked = resources.map(resource => {
    const city = geography && resourceCity(resource, geography)
    return { resource, distance: city && origin ? distanceBetween(origin, city) : undefined }
  })
  return origin ? ranked.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)) : ranked
}

export function cityResources(resources: Resource[], category: Category | undefined, geography: Geography, city: City) {
  const ranked = rankResources(filterResources(resources, category, ''), geography, city)
  const local: RankedResource[] = []
  const coverage: RankedResource[] = []
  const nearby: RankedResource[] = []
  const region = normalizeSearch(city.region)
  for (const entry of ranked) {
    const area = entry.resource.coverage
    const text = normalizeSearch(area.area)
    if (area.scope === 'local' && resourceCity(entry.resource, geography)?.id === city.id) {
      local.push(entry)
    } else if (area.scope === 'national' || (area.scope === 'regional'
      && (includesPlace(text, region) || city.names.some(name => includesPlace(text, name))))) {
      coverage.push(entry)
    } else if (entry.distance !== undefined && nearby.length < 6) {
      nearby.push(entry)
    }
  }
  return { local, coverage, nearby }
}

export function distanceBetween(a: Point, b: Point) {
  const radians = Math.PI / 180
  const angle = Math.sin((b.latitude - a.latitude) * radians / 2) ** 2
    + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians)
    * Math.sin((b.longitude - a.longitude) * radians / 2) ** 2
  return 12_742 * Math.asin(Math.min(1, Math.sqrt(angle)))
}
