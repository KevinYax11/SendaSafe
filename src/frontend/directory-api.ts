import type { Category, Country, DirectoryResults } from '../shared/directory'

export function getResourcesUrl(country: Country, category: Category | '', query: string) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (query) params.set('q', query)
  const search = params.toString()
  return `/api/v1/countries/${country}/resources${search ? `?${search}` : ''}`
}

export async function loadResources(url: string, signal: AbortSignal): Promise<DirectoryResults> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('No se pudo cargar el directorio.')
  return response.json()
}
