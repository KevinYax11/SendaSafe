import { listCountries } from '../backend/directory/catalog'
import { Directory } from '../frontend/directory'

export default function Home() {
  return <Directory countries={listCountries()} />
}
