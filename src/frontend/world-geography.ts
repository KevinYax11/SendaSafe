import type { Point } from './directory-geography'

type Coordinate = [longitude: number, latitude: number]
export type Polygon = Coordinate[][]
export type World = Record<string, [name: string, polygons: Polygon[]]>

let pendingWorld: Promise<World> | undefined

export function loadWorld() {
  pendingWorld ??= fetch('/geography/world.json').then(response => {
    if (!response.ok) throw new Error('No se pudo cargar el mapa.')
    return response.json() as Promise<World>
  }).catch(error => {
    pendingWorld = undefined
    throw error
  })
  return pendingWorld
}

function withinRing({ latitude, longitude }: Point, ring: Coordinate[]) {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index]
    const [lastX, lastY] = ring[previous]
    if ((y > latitude) !== (lastY > latitude) && longitude < (lastX - x) * (latitude - y) / (lastY - y) + x) {
      inside = !inside
    }
  }
  return inside
}

export function countryAt(world: World, point: Point, coastalToleranceKm = 0) {
  const code = Object.keys(world).find(code => world[code][1].some(([outer, ...holes]) =>
    withinRing(point, outer) && !holes.some(ring => withinRing(point, ring))))
  if (code || coastalToleranceKm === 0) return code

  const longitudeScale = 111 * Math.cos(point.latitude * Math.PI / 180)
  let closest: string | undefined
  let smallest = coastalToleranceKm
  for (const [candidate, [, polygons]] of Object.entries(world)) {
    for (const [outline] of polygons) {
      for (let index = 1; index < outline.length; index += 1) {
        const [longitude, latitude] = outline[index - 1]
        const [nextLongitude, nextLatitude] = outline[index]
        if (Math.abs(nextLongitude - longitude) > 180) continue
        const x = (longitude - point.longitude) * longitudeScale
        const y = (latitude - point.latitude) * 111
        const dx = (nextLongitude - longitude) * longitudeScale
        const dy = (nextLatitude - latitude) * 111
        const length = dx * dx + dy * dy
        const fraction = length ? Math.max(0, Math.min(1, -(x * dx + y * dy) / length)) : 0
        const distance = Math.hypot(x + dx * fraction, y + dy * fraction)
        if (distance < smallest) {
          closest = candidate
          smallest = distance
        }
      }
    }
  }
  return closest
}

export function devicePosition(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La ubicación no está disponible en este navegador.'))
      return
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => resolve({
      latitude: coords.latitude, longitude: coords.longitude,
    }), error => reject(new Error(error.code === 1
      ? 'El permiso de ubicación está desactivado. Puedes elegir un país o un municipio.'
      : 'No pudimos obtener tu ubicación. Puedes elegir un país o un municipio.')),
    { timeout: 12_000, maximumAge: 60_000 })
  })
}
