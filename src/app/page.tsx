import guatemala from '../../data/countries/gt/resources.json'
import { Directory } from '../components/directory'
import type { Country, Resource } from '../lib/directory'

const catalogs: Partial<Record<Country, Resource[]>> = {
  GT: guatemala.resources as Resource[],
}

export default function Home() {
  return <Directory catalogs={catalogs} />
}
