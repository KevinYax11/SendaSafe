import { categories, countries, type Category, type ContactChannel, type Country, type Resource } from '../../shared/directory'
import { isShortCode, numberPatterns } from '../../shared/contact-numbers.mjs'
import { textField } from '../../shared/forms'

export function resourceFromForm(data: FormData, country: Country, id: string): Resource | string {
  const organization = textField(data, 'organization')
  const category = textField(data, 'category')
  const service = textField(data, 'service')
  const scope = textField(data, 'scope')
  const area = scope === 'national' ? countries[country] : textField(data, 'area')
  const municipality = textField(data, 'municipality') || null
  const hours = textField(data, 'hours') || null
  const cost = textField(data, 'cost') || null
  const requirements = textField(data, 'requirements') || null
  const method = textField(data, 'method')
  const reviewedOn = textField(data, 'reviewedOn')
  const sources = textField(data, 'sources').split(/\r?\n/).map(value => value.trim()).filter(Boolean)

  if (!organization || organization.length > 180 || !service || service.length > 1000 || !Object.hasOwn(categories, category)) {
    return 'Completa el nombre de la entidad, la descripción y la categoría.'
  }
  if (scope !== 'national' && scope !== 'regional' && scope !== 'local') return 'Selecciona un alcance válido.'
  if (!area || area.length > 180 || (scope === 'local' && !municipality) || (municipality?.length ?? 0) > 120) {
    return 'Indica la zona de atención y, si la cobertura es local, el municipio.'
  }
  if ((hours?.length ?? 0) > 180 || (cost?.length ?? 0) > 180 || (requirements?.length ?? 0) > 500) {
    return 'Revisa la longitud del horario, el costo y los requisitos.'
  }
  const date = new Date(reviewedOn)
  if ((method !== 'institutional-source' && method !== 'phone-confirmed') ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn) || Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== reviewedOn) return 'Indica cómo y cuándo se verificó el recurso.'
  if (sources.length < 1 || sources.length > 8 || sources.some(value => {
    if (value.length > 1000 || !URL.canParse(value)) return true
    const url = new URL(value)
    return url.protocol !== 'https:' || !!url.username || !!url.password
  })) return 'Ingresa entre una y ocho fuentes HTTPS, una por línea.'

  const numbers = data.getAll('number')
  const types = data.getAll('channelType')
  const routings = data.getAll('routing')
  const extensions = data.getAll('extension')
  if (numbers.length < 1 || numbers.length > 8 || [types, routings, extensions].some(fields => fields.length !== numbers.length)) {
    return 'Agrega entre uno y ocho canales de contacto.'
  }
  const channels: ContactChannel[] = []
  for (const [index, rawNumber] of numbers.entries()) {
    const number = typeof rawNumber === 'string' ? rawNumber.replace(/[\s().-]/g, '') : ''
    const type = types[index]
    const routing = routings[index]
    const extension = typeof extensions[index] === 'string' ? extensions[index].trim() : ''
    if ((type !== 'phone' && type !== 'whatsapp') ||
      (routing !== 'short-code' && routing !== 'direct' && routing !== 'switchboard')) return 'Selecciona un tipo de canal y enrutamiento válidos.'

    const short = type === 'phone' && routing !== 'direct' && isShortCode(country, number)
    const full = routing !== 'short-code' && numberPatterns[country].test(number)
    if ((!short && !full) || (type === 'whatsapp' && (routing !== 'direct' || !number.startsWith('+')))) {
      return `El número del canal ${index + 1} no es válido para ${countries[country]}.`
    }
    if (extension && (type !== 'phone' || routing !== 'switchboard' || !/^\d{1,8}$/.test(extension))) {
      return 'Usa una extensión de hasta ocho dígitos únicamente para un conmutador telefónico.'
    }
    channels.push({ type, routing, number, ...(extension ? { extension } : {}) })
  }

  return {
    id, organization, service, category: category as Category,
    coverage: { scope, area, municipality: scope === 'national' ? null : municipality },
    channels, hours, cost, requirements,
    verification: { method, reviewedOn, sources: [...new Set(sources)] },
  }
}
