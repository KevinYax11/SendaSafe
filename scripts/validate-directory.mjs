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
const countries = {
  CU: { name: 'Cuba', numberPattern: /^\+53[2-7]\d{7}$/ },
  VE: { name: 'Venezuela', numberPattern: /^(?:\+58[24]\d{9}|0800\d{7})$/ },
  NI: { name: 'Nicaragua', numberPattern: /^\+505[2578]\d{7}$/ },
  BO: { name: 'Bolivia', numberPattern: /^(?:\+591[23467]\d{7}|800\d{6})$/ },
  PY: { name: 'Paraguay', numberPattern: /^\+595(?:[2-7]\d{7,8}|9\d{8})$/ },
  PR: { name: 'Puerto Rico', numberPattern: /^\+1(?:787|939|800|844)[2-9]\d{6}$/ },
  DO: { name: 'República Dominicana', numberPattern: /^\+1(?:809|829|849)[2-9]\d{6}$/ },
  BR: { name: 'Brasil', numberPattern: /^(?:\+55[1-9]\d(?:[2-5]\d{7}|9\d{8})|0800\d{7})$/ },
  EC: { name: 'Ecuador', numberPattern: /^(?:\+593(?:[2-7]\d{7}|9\d{8})|1800\d{6})$/ },
  UY: { name: 'Uruguay', numberPattern: /^(?:\+598[249]\d{7}|0800\d{4})$/ },
  GT: {
    name: 'Guatemala',
    numberPattern: /^\+502[2-7]\d{7}$/,
    minimumNumbers: {
      emergency: 13,
      'health-and-psychosocial': 11,
      'shelter-and-food': 8,
      'migration-and-legal': 16,
      protection: 9,
    },
  },
  CO: {
    name: 'Colombia',
    numberPattern: /^(?:\+57[36]\d{9}|018000\d{6})$/,
    minimumNumbers: {
      emergency: 6,
      'health-and-psychosocial': 7,
      'shelter-and-food': 6,
      'migration-and-legal': 26,
      protection: 11,
    },
  },
  PA: {
    name: 'Panamá',
    numberPattern: /^\+507(?:[2-9]\d{6}|6\d{7})$/,
    minimumNumbers: {
      emergency: 8,
      'health-and-psychosocial': 10,
      'shelter-and-food': 6,
      'migration-and-legal': 17,
      protection: 12,
    },
  },
  CR: {
    name: 'Costa Rica',
    numberPattern: /^(?:\+506[2-8]\d{7}|800\d{7})$/,
    minimumNumbers: {
      emergency: 6,
      'health-and-psychosocial': 8,
      'shelter-and-food': 6,
      'migration-and-legal': 19,
      protection: 17,
    },
  },
  SV: {
    name: 'El Salvador',
    numberPattern: /^\+503[267]\d{7}$/,
    minimumNumbers: {
      emergency: 12,
      'health-and-psychosocial': 6,
      'shelter-and-food': 6,
      'migration-and-legal': 12,
      protection: 18,
    },
  },
  HN: {
    name: 'Honduras',
    numberPattern: /^\+504[2389]\d{7}$/,
    minimumNumbers: {
      emergency: 6,
      'health-and-psychosocial': 9,
      'shelter-and-food': 8,
      'migration-and-legal': 15,
      protection: 16,
    },
  },
  MX: {
    name: 'México',
    numberPattern: /^\+52[2-9]\d{9}$/,
    minimumNumbers: {
      emergency: 8,
      'health-and-psychosocial': 7,
      'shelter-and-food': 17,
      'migration-and-legal': 12,
      protection: 10,
    },
  },
  AR: { name: 'Argentina', numberPattern: /^(?:\+549?[123]\d{9}|0800\d{7})$/ },
  PE: { name: 'Perú', numberPattern: /^(?:\+51(?:[1-8]\d{7}|9\d{8})|0800\d{5})$/ },
  CL: { name: 'Chile', numberPattern: /^(?:\+56[2-9]\d{8}|600\d{7})$/ },
}
const mexicoShortCodePattern = /^0[1-9]\d$/
const minimumResources = 20 + categories.size * 5

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

function validateChannel(channel, location, channels, country) {
  requireValid(isObject(channel), `${location}: se esperaba un canal.`)
  const { type, number, routing, extension } = channel
  requireValid(type === 'phone' || type === 'whatsapp', `${location}: tipo inválido.`)
  requireValid(routes.has(routing), `${location}: enrutamiento inválido.`)
  requireValid(typeof number === 'string', `${location}: el número debe ser texto.`)

  const isShortCode = shortCodePattern.test(number) || (country === 'MX' && mexicoShortCodePattern.test(number))
  const isPhone = type === 'phone'
  const validShortCode = isPhone && routing !== 'direct' && isShortCode
  const { name, numberPattern } = countries[country]
  const validFullNumber = routing !== 'short-code' && numberPattern.test(number)
  requireValid(validShortCode || validFullNumber, `${location}: número de ${name} inválido.`)
  requireValid(isPhone || routing === 'direct', `${location}: WhatsApp debe ser directo.`)

  if (extension !== undefined) {
    const validExtension = typeof extension === 'string' && /^\d{1,8}$/.test(extension)
    requireValid(isPhone && routing === 'switchboard' && validExtension, `${location}: extensión inválida.`)
  }

  const key = [type, number, extension ?? ''].join('|')
  requireValid(!channels.has(key), `${location}: canal duplicado de ${channels.get(key)}.`)
  channels.set(key, location)
}

function validateResource(resource, location, ids, channels, country) {
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
    validateChannel(channel, `${id}.channels[${index}]`, channels, country)
  })
}

async function validateCatalog(country) {
  const { name, minimumNumbers } = countries[country]
  const path = new URL(`../data/countries/${country.toLowerCase()}/resources.json`, import.meta.url)
  const catalog = JSON.parse(await readFile(path, 'utf8'))
  requireValid(isObject(catalog) && catalog.country === country && catalog.language === 'es', `${name}: país o idioma inválido.`)
  const { resources } = catalog
  requireValid(Array.isArray(resources) && resources.length >= minimumResources, `${name}: se requieren al menos ${minimumResources} fichas.`)

  const ids = new Set()
  const channels = new Map()
  resources.forEach((resource, index) => {
    validateResource(resource, `${country}.resources[${index}]`, ids, channels, country)
  })
  for (const category of categories) {
    const minimum = minimumNumbers?.[category] ?? 5
    const numbers = new Set(resources
      .filter(resource => resource.category === category)
      .flatMap(resource => resource.channels.map(channel => channel.number)))
    requireValid(numbers.size >= minimum, `${name}: ${category} requiere al menos ${minimum} números distintos.`)
  }
  console.log(`${name}: ${ids.size} fichas válidas y ${channels.size} canales de contacto.`)
}

try {
  for (const country of Object.keys(countries)) await validateCatalog(country)
} catch (error) {
  console.error(`Error al validar el directorio: ${error.message}`)
  process.exitCode = 1
}
