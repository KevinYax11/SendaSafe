import 'server-only'

import guatemala from '../../../data/countries/gt/resources.json'
import catalogHT from '../../../data/countries/ht/resources.json'
import catalogCU from '../../../data/countries/cu/resources.json'
import catalogVE from '../../../data/countries/ve/resources.json'
import catalogNI from '../../../data/countries/ni/resources.json'
import catalogBO from '../../../data/countries/bo/resources.json'
import py from '../../../data/countries/py/resources.json'
import pr from '../../../data/countries/pr/resources.json'
import dominicanRepublic from '../../../data/countries/do/resources.json'
import br from '../../../data/countries/br/resources.json'
import ec from '../../../data/countries/ec/resources.json'
import uy from '../../../data/countries/uy/resources.json'
import ar from '../../../data/countries/ar/resources.json'
import cl from '../../../data/countries/cl/resources.json'
import co from '../../../data/countries/co/resources.json'
import pa from '../../../data/countries/pa/resources.json'
import pe from '../../../data/countries/pe/resources.json'
import cr from '../../../data/countries/cr/resources.json'
import sv from '../../../data/countries/sv/resources.json'
import hn from '../../../data/countries/hn/resources.json'
import mexico from '../../../data/countries/mx/resources.json'
import { countries, type Category, type Country, type DirectoryCountry, type DirectoryResults, type Resource } from '../../shared/directory'
import { filterResources } from '../../shared/search-resources'
import { managedResources } from './overrides'

const catalogs: Partial<Record<Country, Resource[]>> = {
  GT: guatemala.resources as Resource[],
  HT: catalogHT.resources as Resource[],
  CU: catalogCU.resources as Resource[],
  VE: catalogVE.resources as Resource[],
  NI: catalogNI.resources as Resource[],
  BO: catalogBO.resources as Resource[],
  PY: py.resources as Resource[],
  PR: pr.resources as Resource[],
  DO: dominicanRepublic.resources as Resource[],
  BR: br.resources as Resource[],
  EC: ec.resources as Resource[],
  UY: uy.resources as Resource[],
  AR: ar.resources as Resource[],
  CL: cl.resources as Resource[],
  CO: co.resources as Resource[],
  PA: pa.resources as Resource[],
  PE: pe.resources as Resource[],
  CR: cr.resources as Resource[],
  SV: sv.resources as Resource[],
  HN: hn.resources as Resource[],
  MX: mexico.resources as Resource[],
}

export function baseResources(code: Country) {
  return catalogs[code] ?? []
}

function describeCountry(code: Country, resources = baseResources(code)): DirectoryCountry {
  return {
    code,
    name: countries[code],
    hasCoverage: resources.length > 0,
    hasEmergencyResources: resources.some(resource => resource.category === 'emergency'),
  }
}

export function listCountries(): DirectoryCountry[] {
  return (Object.keys(countries) as Country[]).map(code => describeCountry(code))
}

export async function searchResources(code: Country, category: Category | undefined, query: string): Promise<DirectoryResults> {
  const available = (await managedResources(code, baseResources(code)))
    .filter(entry => !entry.archived).map(entry => entry.resource)
  const resources = filterResources(available, category, query)

  return { country: describeCountry(code, available), resources }
}
