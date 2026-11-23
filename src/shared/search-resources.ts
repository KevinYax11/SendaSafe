import { categories, type Category, type Resource } from './directory'

export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function filterResources(resources: Resource[], category: Category | undefined, query: string) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean)
  return resources.filter(resource => {
    if (category && resource.category !== category) return false
    if (terms.length === 0) return true
    const text = normalizeSearch([
      resource.organization, resource.service, resource.coverage.area,
      resource.coverage.municipality, categories[resource.category],
    ].join(' '))
    return terms.every(term => text.includes(term))
  })
}
