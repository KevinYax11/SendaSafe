import { countries, type Country } from './directory'

export type FormResult = { error?: string; success?: string }

export function countryCode(value: unknown): Country | null {
  return typeof value === 'string' && Object.hasOwn(countries, value) ? value as Country : null
}

export function textField(data: FormData, name: string): string {
  const value = data.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export function pageNumber(value: unknown) {
  const number = typeof value === 'string' && /^\d{1,5}$/.test(value) ? Number(value) : 1
  return Math.max(1, number)
}
