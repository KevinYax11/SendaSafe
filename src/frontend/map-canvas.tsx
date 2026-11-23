'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import type { Point } from './directory-geography'
import { countryAt, type Polygon, type World } from './world-geography'

export type MapMarker = Point & { id: string; label: string; count: number }

const width = 960
const height = 480

function getBounds(polygons: Polygon[]) {
  let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity
  for (const [outline] of polygons) {
    for (const [lon, lat] of outline) {
      west = Math.min(west, lon)
      east = Math.max(east, lon)
      south = Math.min(south, lat)
      north = Math.max(north, lat)
    }
  }
  return { west, east, south, north }
}

function getProjection(polygons: Polygon[] | undefined, center: Point | null, zoom: number) {
  const { west, east, south, north } = polygons
    ? getBounds(polygons) : { west: -180, east: 180, south: -88, north: 88 }
  const latitude = center?.latitude ?? (south + north) / 2
  const longitude = center?.longitude ?? (west + east) / 2
  const horizontal = Math.max(0.3, Math.cos(latitude * Math.PI / 180))
  const inset = polygons ? 70 : 20
  const scale = Math.min((width - inset) / Math.max(0.5, (east - west) * horizontal),
    (height - inset) / Math.max(0.3, north - south)) * zoom
  return {
    x: (value: number) => width / 2 + (value - longitude) * scale * horizontal,
    y: (value: number) => height / 2 - (value - latitude) * scale,
    point: (x: number, y: number) => ({
      latitude: latitude + (height / 2 - y) / scale,
      longitude: longitude + (x - width / 2) / (scale * horizontal),
    }),
  }
}

function trace(context: CanvasRenderingContext2D, polygon: Polygon, projection: ReturnType<typeof getProjection>) {
  context.beginPath()
  for (const ring of polygon) {
    ring.forEach(([lon, lat], index) => {
      const x = projection.x(lon)
      const y = projection.y(lat)
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.closePath()
  }
}

function pinPositions(markers: MapMarker[], projection: ReturnType<typeof getProjection>, displayWidth: number) {
  const factor = displayWidth / width
  const displayHeight = height * factor
  const gap = 28
  const placements: { marker: MapMarker; x: number; y: number; dx: number; dy: number }[] = []
  const sorted = [...markers].sort((a, b) => b.count - a.count)
  for (const marker of sorted) {
    const x = projection.x(marker.longitude) * factor
    const y = projection.y(marker.latitude) * factor
    if (x < 0 || x > displayWidth || y < 0 || y > displayHeight) continue
    const available = (dx: number, dy: number) => {
      const nextX = x + dx
      const nextY = y + dy
      return nextX >= 13 && nextX <= displayWidth - 13 && nextY >= 13 && nextY <= displayHeight - 13
        && placements.every(pin => Math.hypot(nextX - pin.x - pin.dx, nextY - pin.y - pin.dy) >= gap)
    }
    let dx = 0, dy = 0
    if (!available(dx, dy)) {
      for (let ring = 1; ring <= 5; ring += 1) {
        const slots = 8 * ring
        for (let slot = 0; slot < slots; slot += 1) {
          const angle = slot * 2 * Math.PI / slots
          const shiftX = gap * ring * Math.cos(angle)
          const shiftY = gap * ring * Math.sin(angle)
          if (available(shiftX, shiftY)) {
            dx = shiftX
            dy = shiftY
            break
          }
        }
        if (dx || dy) break
      }
    }
    placements.push({ marker, x, y, dx, dy })
  }
  return placements
}

type Props = {
  world: World
  coverage: ReadonlySet<string>
  selected: string
  origin: Point | null
  markers: MapMarker[]
  activeMarker: string
  zoom: number
  onSelectCountry: (country: string) => void
  onSelectPoint: (point: Point) => void
  onSelectMarker: (id: string) => void
}

export function MapCanvas({
  world, coverage, selected, origin, markers, activeMarker, zoom, onSelectCountry, onSelectPoint, onSelectMarker,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [displayWidth, setDisplayWidth] = useState(width)
  const projection = useMemo(() => getProjection(world[selected]?.[1], zoom > 1 ? origin : null, zoom),
    [world, selected, origin, zoom])
  const countryDots = useMemo(() => Array.from(coverage, code => {
    const { west, east, south, north } = getBounds(world[code][1])
    return { code, longitude: (west + east) / 2, latitude: (south + north) / 2 }
  }), [coverage, world])
  const pins = useMemo(() => pinPositions(markers, projection, displayWidth), [markers, projection, displayWidth])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const size = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setDisplayWidth(entry.contentRect.width)
    })
    size.observe(element)
    return () => size.disconnect()
  }, [])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    element.width = width * ratio
    element.height = height * ratio
    context.scale(ratio, ratio)
    context.fillStyle = '#e9e1e9'
    context.fillRect(0, 0, width, height)

    for (const [code, [, polygons]] of Object.entries(world)) {
      context.fillStyle = code === selected ? '#e8bc9a' : coverage.has(code) ? '#d0aabd' : '#fbf5eb'
      context.strokeStyle = code === selected ? '#975438' : '#bdaabd'
      context.lineWidth = code === selected ? 1.4 : 0.6
      for (const polygon of polygons) {
        trace(context, polygon, projection)
        context.fill('evenodd')
        context.stroke()
      }
    }
    function drawDot(point: Point, radius: number, color: string) {
      if (!context) return
      const x = projection.x(point.longitude)
      const y = projection.y(point.latitude)
      context.beginPath()
      context.arc(x, y, radius, 0, 2 * Math.PI)
      context.fillStyle = color
      context.fill()
      context.strokeStyle = '#fff'
      context.lineWidth = 1.6
      context.stroke()
    }
    if (!selected) countryDots.forEach(point => drawDot(point, 3.8, '#5a3158'))
    if (origin) drawDot(origin, 7, '#285ba9')
  }, [world, selected, origin, coverage, countryDots, projection])

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) * width / rect.width
    const y = (event.clientY - rect.top) * height / rect.height
    const distance = (point: Point) => Math.hypot(projection.x(point.longitude) - x, projection.y(point.latitude) - y)
    const threshold = Math.max(12, 13 * width / rect.width)
    const point = projection.point(x, y)
    if (selected) {
      if (countryAt(world, point) === selected) onSelectPoint(point)
      return
    }
    const code = countryAt(world, point)
    const closest = [...countryDots].sort((a, b) => distance(a) - distance(b))[0]
    if (code && coverage.has(code)) onSelectCountry(code)
    else if (closest && distance(closest) < threshold) onSelectCountry(closest.code)
    else if (code) onSelectCountry(code)
  }

  return (
    <>
      <canvas ref={canvas} width={width} height={height} onClick={handleClick} role="img"
        aria-label={selected ? `Mapa de ${world[selected][0]}`
          : 'Mapa mundial con los países del directorio destacados. Usa el selector de país para navegar con el teclado.'} />
      {pins.map(({ marker, x, y, dx, dy }) => {
        const label = `${marker.label}, ${marker.count} ${marker.count === 1 ? 'recurso' : 'recursos'}`
        return <div key={marker.id} className="map-pin-position" style={{ left: x, top: y }}>
          {(dx !== 0 || dy !== 0) && <span className="map-pin-guide" aria-hidden="true"
            style={{ width: Math.hypot(dx, dy), transform: `rotate(${Math.atan2(dy, dx)}rad)` }} />}
          <button className="map-pin" type="button" title={label} aria-label={label}
            aria-pressed={marker.id === activeMarker} style={{ left: dx, top: dy }}
            onClick={() => onSelectMarker(marker.id)}>{marker.count}</button>
        </div>
      })}
    </>
  )
}
