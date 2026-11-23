import type { Resource } from '../shared/directory'

export type Point = { latitude: number; longitude: number }
export type Municipality = Point & { area: string; municipality: string }

export type Boundary = { code: string; rings: [number, number][][] }

export function orderResources(resources: Resource[], places: Municipality[], origin: Point | null) {
  if (!origin) return resources.map(resource => ({ resource, distance: undefined }))

  const byArea = new Map(places.map(place => [place.area, place]))
  return resources.map(resource => {
    const place = resource.coverage.scope === 'local' ? byArea.get(resource.coverage.area) : undefined
    return { resource, distance: place ? distanceBetween(origin, place) : undefined }
  }).sort((a, b) => (a.distance ?? Number.MAX_VALUE) - (b.distance ?? Number.MAX_VALUE))
}

function distanceBetween(a: Point, b: Point) {
  const radians = Math.PI / 180
  const angle = Math.sin((b.latitude - a.latitude) * radians / 2) ** 2
    + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians)
    * Math.sin((b.longitude - a.longitude) * radians / 2) ** 2
  return 12_742 * Math.asin(Math.min(1, Math.sqrt(angle)))
}
