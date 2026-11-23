import type { Country, DirectoryResults } from '../shared/directory'
import { countryCode } from '../shared/forms'
import { geographyUrl } from './directory-geography'

const cacheName = 'sendasafe-directory-v1'
export type SavedDirectory = { result: DirectoryResults; savedAt: string }

function key(country: Country) {
  return `/api/v1/countries/${country}/resources`
}

export async function readSavedDirectory(country: Country): Promise<SavedDirectory | null> {
  try { return await (await (await caches.open(cacheName)).match(key(country)))?.json() ?? null }
  catch { return null }
}

export async function saveDirectory(country: Country): Promise<SavedDirectory> {
  const response = await fetch(key(country), { cache: 'no-store' })
  if (!response.ok) throw new Error('Directory unavailable')
  const result = await response.json() as DirectoryResults
  if (result.country.code !== country || !Array.isArray(result.resources)) throw new Error('Invalid directory')
  if (!(await (await caches.open('sendasafe-shell-v1')).match('/'))) throw new Error('Offline app is not ready')
  const saved = { result, savedAt: new Date().toISOString() }
  const cache = await caches.open(cacheName)
  await cache.put(key(country), Response.json(saved))
  try {
    const geography = await fetch(geographyUrl(country), { signal: AbortSignal.timeout(8000) })
    if (geography.ok) await cache.put(geographyUrl(country), geography)
  } catch { /* The contacts remain available when the additional lookup data is unavailable. */ }
  return saved
}

export async function refreshSavedDirectories() {
  try {
    const requests = await (await caches.open(cacheName)).keys()
    for (const request of requests) {
      const country = countryCode(new URL(request.url).pathname.split('/')[4])
      if (!country) continue
      try { await saveDirectory(country) } catch { /* Keep the last successful copy. */ }
    }
  } catch { /* Offline storage may be unavailable. */ }
}
