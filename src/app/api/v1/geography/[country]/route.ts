import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Boundary, Municipality } from '../../../../../frontend/directory-geography'
import { countryCode } from '../../../../../shared/forms'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ country: string }> }) {
  const country = countryCode((await params).country.toUpperCase())
  if (!country) return new Response(null, { status: 404 })
  const path = resolve(/* turbopackIgnore: true */ process.env.SENDASAFE_GEOGRAPHY_PATH || 'data/geography')
  try {
    const [places, outlines] = await Promise.all([
      readFile(join(/* turbopackIgnore: true */ path, 'municipalities.json'), 'utf8'),
      readFile(join(/* turbopackIgnore: true */ path, 'boundaries.json'), 'utf8'),
    ])
    const municipalities = (JSON.parse(places) as Record<string, Municipality[]>)[country]
    if (!Array.isArray(municipalities) || !municipalities.length) return new Response(null, { status: 404 })
    const boundaries = (JSON.parse(outlines) as Boundary[]).filter(boundary => boundary.code === country)
    return Response.json({ places: municipalities, boundaries })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Response(null, { status: 404 })
    console.error('Could not load configured geography', error)
    return new Response(null, { status: 503 })
  }
}
