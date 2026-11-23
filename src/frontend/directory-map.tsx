'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { Boundary, Municipality, Point } from './directory-geography'

type Props = {
  country: string
  places: Municipality[]
  boundaries: Boundary[]
  origin: Point | null
  onOriginChange: (point: Point | null) => void
}

const width = 900
const height = 460

function getProjection(places: Municipality[], center: Point | null, zoom: number) {
  const latitudes = places.map(place => place.latitude)
  const longitudes = places.map(place => place.longitude)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const latitude = center?.latitude ?? (minLat + maxLat) / 2
  const longitude = center?.longitude ?? (minLon + maxLon) / 2
  const horizontal = Math.cos(latitude * Math.PI / 180)
  const scale = Math.min((width - 90) / Math.max(1, (maxLon - minLon) * horizontal), (height - 90) / Math.max(0.6, maxLat - minLat)) * zoom
  return {
    x: (value: number) => width / 2 + (value - longitude) * scale * horizontal,
    y: (value: number) => height / 2 - (value - latitude) * scale,
    point: (x: number, y: number) => ({
      latitude: latitude + (height / 2 - y) / scale,
      longitude: longitude + (x - width / 2) / (scale * horizontal),
    }),
  }
}

export function DirectoryMap({ country, places, boundaries, origin, onOriginChange }: Readonly<Props>) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const locationRequest = useRef(0)
  const [area, setArea] = useState('')
  const [message, setMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<Point | null>(null)

  useEffect(() => () => { locationRequest.current += 1 }, [])

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) return
    const { x, y } = getProjection(places, center, zoom)
    context.fillStyle = '#dce9e5'
    context.fillRect(0, 0, width, height)
    context.lineWidth = 1

    for (const boundary of boundaries) {
      const isSelected = boundary.code === country
      context.fillStyle = isSelected ? '#f7f8ed' : '#e9eee4'
      context.strokeStyle = isSelected ? '#78978a' : '#b8c8bf'
      for (const ring of boundary.rings) {
        context.beginPath()
        ring.forEach(([longitude, latitude], index) => {
          if (index === 0) context.moveTo(x(longitude), y(latitude))
          else context.lineTo(x(longitude), y(latitude))
        })
        context.closePath()
        context.fill()
        context.stroke()
      }
    }

    for (const place of places) {
      context.beginPath()
      context.arc(x(place.longitude), y(place.latitude), 5, 0, 2 * Math.PI)
      context.fillStyle = '#14665b'
      context.fill()
      context.strokeStyle = '#fff'
      context.lineWidth = 1.5
      context.stroke()
    }
    if (origin) {
      context.beginPath()
      context.arc(x(origin.longitude), y(origin.latitude), 10, 0, 2 * Math.PI)
      context.fillStyle = '#2255b4'
      context.fill()
      context.strokeStyle = '#fff'
      context.lineWidth = 3
      context.stroke()
    }
  }, [country, places, boundaries, origin, center, zoom])

  function selectPoint(point: Point | null, label: string) {
    locationRequest.current += 1
    setLocating(false)
    setArea(label)
    setMessage('')
    onOriginChange(point)
  }

  function selectOnMap(event: MouseEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const projection = getProjection(places, center, zoom)
    const x = (event.clientX - bounds.left) / bounds.width * width
    const y = (event.clientY - bounds.top) / bounds.height * height
    const place = places.find(item => Math.hypot(projection.x(item.longitude) - x, projection.y(item.latitude) - y) < 12)
    const point = place ?? projection.point(x, y)
    if (Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180) selectPoint(point, place?.area ?? '')
  }

  function locate() {
    if (!navigator.geolocation) {
      setMessage('La ubicación no está disponible. Puedes elegir una zona en el mapa.')
      return
    }
    const requestId = ++locationRequest.current
    setLocating(true)
    setMessage('Solicitando tu ubicación…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (locationRequest.current !== requestId) return
        selectPoint({ latitude: coords.latitude, longitude: coords.longitude }, '')
        setMessage('Ubicación aplicada a las sugerencias.')
      },
      error => {
        if (locationRequest.current !== requestId) return
        setLocating(false)
        setMessage(error.code === 1
          ? 'El navegador no concedió acceso. Puedes elegir una zona manualmente.'
          : 'No pudimos obtener tu ubicación. Puedes elegir una zona manualmente.')
      },
      { timeout: 12_000, maximumAge: 0 },
    )
  }

  return (
    <div className="map-content">
      <p>Elige un municipio, pulsa el mapa o usa tu ubicación para ordenar los resultados por cercanía.</p>
      <div className="map-toolbar">
        <div>
          <label htmlFor="map-area">Municipio de referencia</label>
          <select id="map-area" value={area} onChange={event => {
            const place = places.find(place => place.area === event.target.value)
            selectPoint(place ?? null, place?.area ?? '')
          }}>
            <option value="">Elige un municipio</option>
            {places.map(place => <option key={place.area} value={place.area}>{place.area}</option>)}
          </select>
        </div>
        <button className="location-button" type="button" onClick={locate} disabled={locating}>Usar mi ubicación</button>
      </div>
      <div className="map-frame">
        <canvas ref={canvas} width={width} height={height} onClick={selectOnMap}
          role="img" aria-label="Mapa de municipios con recursos. También puedes elegir el municipio en el selector." />
        <div className="map-controls">
          <button type="button" aria-label="Acercar el mapa" disabled={zoom >= 8} onClick={() => {
            setCenter(origin)
            setZoom(zoom * 2)
          }}>+</button>
          <button type="button" aria-label="Alejar el mapa" disabled={zoom === 1} onClick={() => {
            if (zoom === 2) setCenter(null)
            setZoom(zoom / 2)
          }}>−</button>
        </div>
      </div>
      <div className="map-caption">
        <span>Mapa de referencia · <a href="https://www.naturalearthdata.com/">Natural Earth</a> · <a href="https://www.geonames.org/">GeoNames</a></span>
        {origin && <button type="button" onClick={() => {
          selectPoint(null, '')
          setCenter(null)
          setZoom(1)
        }}>Quitar referencia</button>}
      </div>
      {message && <p role="status">{message}</p>}
      <p>Tu ubicación se usa en este navegador. Las distancias son en línea recta hasta el centro del municipio.</p>
    </div>
  )
}
