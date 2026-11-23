'use server'

import { randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'
import { authenticate, clearAdminSession, isAdmin } from '../../backend/admin-auth'
import { moderateComment, removeRejectedComment, type CommentStatus } from '../../backend/community'
import { baseResources } from '../../backend/directory/catalog'
import { archiveResource, listEntities, managedResources, saveEntity, writeResource } from '../../backend/directory/overrides'
import { resourceFromForm } from '../../backend/directory/resource-form'
import { pageNumber, countryCode, textField, type FormResult } from '../../shared/forms'
import type { Country } from '../../shared/directory'

function integer(value: string) {
  return /^\d{1,15}$/.test(value) && Number(value) > 0 ? Number(value) : null
}

async function requireAdmin() {
  if (!await isAdmin()) redirect('/admin')
}

function panelUrl(country: Country, view: string, params: Record<string, string> = {}) {
  return '/admin?' + new URLSearchParams({ country, view, ...params })
}

export async function login(_result: FormResult, data: FormData): Promise<FormResult> {
  const candidate = data.get('password')
  if (typeof candidate !== 'string' || candidate.length > 512) return { error: 'La contraseña no es válida.' }
  const outcome = await authenticate(candidate)
  if (outcome === 'ok') redirect('/admin')
  if (outcome === 'limited') return { error: 'Hubo demasiados intentos. Vuelve a intentarlo en 15 minutos.' }
  if (outcome === 'disabled') return { error: 'El acceso administrativo todavía no está configurado.' }
  return { error: 'La contraseña no es válida.' }
}

export async function logout() {
  await requireAdmin()
  await clearAdminSession()
  redirect('/admin')
}

export async function updateComment(data: FormData) {
  await requireAdmin()
  const country = countryCode(textField(data, 'country'))
  const id = integer(textField(data, 'id'))
  const from = textField(data, 'status') as CommentStatus
  const decision = textField(data, 'decision')
  const to = decision as CommentStatus
  const transitions: Record<CommentStatus, CommentStatus[]> = {
    pending: ['published', 'rejected'],
    published: ['rejected'],
    rejected: ['pending'],
  }
  const remove = decision === 'delete' && from === 'rejected'
  if (!country || !id || !Object.hasOwn(transitions, from) || (!remove && !transitions[from].includes(to))) redirect('/admin')
  const updated = remove ? await removeRejectedComment(country, id) : await moderateComment(country, id, from, to)
  redirect(panelUrl(country, 'comments', {
    status: from, page: String(pageNumber(textField(data, 'page'))), notice: updated ? 'moderated' : 'stale',
  }))
}

export async function updateEntity(_result: FormResult, data: FormData): Promise<FormResult> {
  await requireAdmin()
  const country = countryCode(textField(data, 'country'))
  const idText = textField(data, 'id')
  const id = integer(idText)
  const name = textField(data, 'name')
  if (!country || (idText && !id) || name.length < 2 || name.length > 180) return { error: 'Ingresa un nombre válido para la entidad.' }
  if (!await saveEntity(country, id, name)) return { error: 'Ya existe una entidad con ese nombre o la ficha ya no está disponible.' }
  redirect(panelUrl(country, 'entities', { notice: 'entity' }))
}

export async function updateResource(_result: FormResult, data: FormData): Promise<FormResult> {
  await requireAdmin()
  const country = countryCode(textField(data, 'country'))
  if (!country) return { error: 'Selecciona un país válido.' }
  const currentId = textField(data, 'id')
  const baseline = baseResources(country)
  const id = currentId || `${country.toLowerCase()}-${randomUUID()}`
  const entityField = textField(data, 'entity')
  const entityId = integer(entityField)
  if (entityField && entityId === null) return { error: 'Selecciona una entidad válida.' }
  const entity = (await listEntities(country)).find(entry => entry.id === entityId)
  if (entity) data.set('organization', entity.name)
  const resource = resourceFromForm(data, country, id)
  if (typeof resource === 'string') return { error: resource }
  const result = await writeResource(country, baseline, resource, entityId, currentId ? 'edit' : 'create')
  if (result === 'entity') return { error: 'La entidad seleccionada no pertenece a ese país.' }
  if (result === 'duplicate') return { error: 'Uno de los canales está repetido o ya pertenece a otro recurso publicado en este país.' }
  if (result !== 'ok') return { error: 'El recurso cambió mientras editabas. Abre su ficha nuevamente.' }
  redirect(panelUrl(country, 'resources', { notice: 'resource' }))
}

export async function toggleResource(data: FormData) {
  await requireAdmin()
  const country = countryCode(textField(data, 'country'))
  if (!country) redirect('/admin')
  const id = textField(data, 'id')
  const baseline = baseResources(country)
  const entry = (await managedResources(country, baseline)).find(item => item.resource.id === id)
  const archived = textField(data, 'archived') === 'true'
  if (!entry || entry.archived !== archived) redirect(panelUrl(country, 'resources', { notice: 'stale' }))
  if (!archived) {
    await archiveResource(country, id)
    redirect(panelUrl(country, 'resources', { notice: 'archived' }))
  }
  const restored = await writeResource(country, baseline, entry.resource, entry.entityId, 'restore') === 'ok'
  redirect(panelUrl(country, 'resources', { notice: restored ? 'restored' : 'restore-error' }))
}
