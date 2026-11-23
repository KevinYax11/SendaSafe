import type { Metadata } from 'next'
import { listCountries } from '../../backend/directory/catalog'
import { MapExplorer } from '../../frontend/map-explorer'
import { countryCode } from '../../shared/forms'

export const metadata: Metadata = { title: 'Mapa de recursos | SendaSafe' }

export default async function MapPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams
  return <MapExplorer countries={listCountries()} initialCountry={countryCode(country) ?? ''} />
}
