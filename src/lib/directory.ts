export const countries = {
  AR: 'Argentina',
  BO: 'Bolivia',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  EC: 'Ecuador',
  SV: 'El Salvador',
  GT: 'Guatemala',
  HT: 'Haití',
  HN: 'Honduras',
  MX: 'México',
  NI: 'Nicaragua',
  PA: 'Panamá',
  PY: 'Paraguay',
  PE: 'Perú',
  PR: 'Puerto Rico',
  DO: 'República Dominicana',
  UY: 'Uruguay',
  VE: 'Venezuela',
} as const

export const categories = {
  emergency: 'Emergencias',
  'health-and-psychosocial': 'Salud y apoyo psicosocial',
  'shelter-and-food': 'Albergues y alimentación',
  'migration-and-legal': 'Migración y orientación legal',
  protection: 'Protección a víctimas',
} as const

export type Country = keyof typeof countries
export type Category = keyof typeof categories

export type ContactChannel = {
  type: 'phone' | 'whatsapp'
  number: string
  routing: 'short-code' | 'direct' | 'switchboard'
  extension?: string
}

export type Resource = {
  id: string
  organization: string
  category: Category
  service: string
  coverage: {
    scope: 'national' | 'regional' | 'local'
    area: string
    municipality: string | null
  }
  channels: ContactChannel[]
  hours: string | null
  cost: string | null
  requirements: string | null
  verification: {
    method: 'institutional-source' | 'phone-confirmed'
    reviewedOn: string
    sources: string[]
  }
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es')
}

export function matchesSearch(resource: Resource, query: string) {
  const text = normalizeSearch([
    resource.organization,
    resource.service,
    resource.coverage.area,
    resource.coverage.municipality,
    categories[resource.category],
  ].join(' '))

  return normalizeSearch(query).trim().split(/\s+/).every(term => text.includes(term))
}
