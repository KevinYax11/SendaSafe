import 'server-only'

import guatemala from '../../../data/countries/gt/resources.json'
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
import { categories, countries, type Category, type Country, type DirectoryCountry, type DirectoryResults, type Resource } from '../../shared/directory'

const catalogs: Partial<Record<Country, Resource[]>> = {
  GT: guatemala.resources as Resource[],
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

function describeCountry(code: Country): DirectoryCountry {
  const resources = catalogs[code] ?? []
  return {
    code,
    name: countries[code],
    hasCoverage: resources.length > 0,
    hasEmergencyResources: resources.some(resource => resource.category === 'emergency'),
  }
}

export function listCountries(): DirectoryCountry[] {
  return (Object.keys(countries) as Country[]).map(describeCountry)
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es')
}

function matchesSearch(resource: Resource, terms: string[]) {
  const text = normalizeSearch([
    resource.organization,
    resource.service,
    resource.coverage.area,
    resource.coverage.municipality,
    categories[resource.category],
  ].join(' '))

  return terms.every(term => text.includes(term))
}

export function searchResources(code: Country, category: Category | undefined, query: string): DirectoryResults {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean)
  const resources = (catalogs[code] ?? []).filter(resource => (
    (!category || resource.category === category) && matchesSearch(resource, terms)
  ))

  return { country: describeCountry(code), resources }
}
