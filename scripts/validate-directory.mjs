import { readFile } from 'node:fs/promises'

const categories = new Set([
  'emergency',
  'health-and-psychosocial',
  'shelter-and-food',
  'migration-and-legal',
  'protection',
])
const scopes = new Set(['national', 'regional', 'local'])
const routes = new Set(['short-code', 'direct', 'switchboard'])
const verificationMethods = new Set(['institutional-source', 'phone-confirmed'])
const shortCodePattern = /^[1-9]\d{2,3}$/
const guatemalaNumberPattern = /^\+502[2-7]\d{7}$/
const minimumResources = 20

function requireValid(condition, message) {
  if (!condition) throw new Error(message)
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isHttpsUrl(value) {
  return isText(value) && /^https:\/\//.test(value) && URL.canParse(value)
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validateChannel(channel, location, channels) {
  requireValid(isObject(channel), `${location}: se esperaba un canal.`)
  const { type, number, routing, extension } = channel
  requireValid(type === 'phone' || type === 'whatsapp', `${location}: tipo inválido.`)
  requireValid(routes.has(routing), `${location}: enrutamiento inválido.`)
  requireValid(typeof number === 'string', `${location}: el número debe ser texto.`)

  const isShortCode = shortCodePattern.test(number)
  const isPhone = type === 'phone'
  const validShortCode = isPhone && routing !== 'direct' && isShortCode
  const validFullNumber = routing !== 'short-code' && guatemalaNumberPattern.test(number)
  requireValid(validShortCode || validFullNumber, `${location}: número de Guatemala inválido.`)
  requireValid(isPhone || routing === 'direct', `${location}: WhatsApp debe ser directo.`)

  if (extension !== undefined) {
    const validExtension = typeof extension === 'string' && /^\d{1,8}$/.test(extension)
    requireValid(isPhone && routing === 'switchboard' && validExtension, `${location}: extensión inválida.`)
  }

  const key = [type, number, extension ?? ''].join('|')
  requireValid(!channels.has(key), `${location}: canal duplicado de ${channels.get(key)}.`)
  channels.set(key, location)
}

function validateResource(resource, location, ids, channels) {
  requireValid(isObject(resource), `${location}: se esperaba una ficha.`)
  const { id, organization, category, service, coverage, verification } = resource
  requireValid(isText(id) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id), `${location}: ID inválido.`)
  requireValid(!ids.has(id), `${location}: ID duplicado (${id}).`)
  ids.add(id)

  requireValid(isText(organization) && isText(service), `${id}: falta la entidad o el servicio.`)
  requireValid(categories.has(category), `${id}: categoría inválida.`)
  requireValid(isObject(coverage) && scopes.has(coverage.scope), `${id}: cobertura inválida.`)
  requireValid(isText(coverage.area), `${id}: falta el área de cobertura.`)
  const municipalityOptional = coverage.scope !== 'local' && coverage.municipality === null
  requireValid(municipalityOptional || isText(coverage.municipality), `${id}: municipio inválido.`)

  for (const field of ['hours', 'cost', 'requirements']) {
    requireValid(resource[field] === null || isText(resource[field]), `${id}: ${field} debe ser texto o null.`)
  }

  requireValid(isObject(verification), `${id}: faltan datos de verificación.`)
  requireValid(verificationMethods.has(verification.method), `${id}: método de verificación inválido.`)
  requireValid(isCalendarDate(verification.reviewedOn), `${id}: fecha de revisión inválida.`)
  const { sources } = verification
  requireValid(Array.isArray(sources) && sources.length > 0 && sources.every(isHttpsUrl), `${id}: se requiere una fuente HTTPS válida.`)

  requireValid(Array.isArray(resource.channels) && resource.channels.length > 0, `${id}: falta un canal de atención.`)
  resource.channels.forEach((channel, index) => {
    validateChannel(channel, `${id}.channels[${index}]`, channels)
  })
}

async function main() {
  const path = new URL('../data/countries/gt/resources.json', import.meta.url)
  const catalog = JSON.parse(await readFile(path, 'utf8'))
  requireValid(isObject(catalog) && catalog.country === 'GT' && catalog.language === 'es', 'País o idioma inválido.')
  const { resources } = catalog
  requireValid(Array.isArray(resources) && resources.length >= minimumResources, `Se requieren al menos ${minimumResources} fichas.`)

  const ids = new Set()
  const channels = new Map()
  resources.forEach((resource, index) => {
    validateResource(resource, `resources[${index}]`, ids, channels)
  })
  console.log(`Guatemala: ${ids.size} fichas válidas y ${channels.size} canales de contacto.`)
}

try {
  await main()
} catch (error) {
  console.error(`Error al validar el directorio: ${error.message}`)
  process.exitCode = 1
}
