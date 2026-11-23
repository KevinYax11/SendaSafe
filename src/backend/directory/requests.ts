import { categories, countries, maxSearchLength, type Category, type Country, type DirectoryError } from '../../shared/directory'
import { listCountries, searchResources } from './catalog'

const searchHeaders = { 'Cache-Control': 'no-store' }

function errorResponse(status: number, code: DirectoryError['error']['code'], message: string) {
  return Response.json({ error: { code, message } } satisfies DirectoryError, { status, headers: searchHeaders })
}

export function countriesResponse() {
  return Response.json({ countries: listCountries() })
}

export async function resourcesResponse(url: string, country: string) {
  const code = country.toUpperCase()
  if (!Object.hasOwn(countries, code)) {
    return errorResponse(404, 'country_not_supported', 'El país no está en el directorio.')
  }

  const params = new URL(url).searchParams
  const selections = params.getAll('category')
  const category = selections[0]
  if (selections.length > 1 || (category !== undefined && !Object.hasOwn(categories, category))) {
    return errorResponse(400, 'invalid_category', 'Selecciona una categoría válida.')
  }

  const queries = params.getAll('q')
  const query = queries[0] ?? ''
  if (queries.length > 1 || query.length > maxSearchLength) {
    return errorResponse(400, 'invalid_query', `La búsqueda admite hasta ${maxSearchLength} caracteres en un solo parámetro.`)
  }

  return Response.json(await searchResources(code as Country, category as Category | undefined, query), { headers: searchHeaders })
}
