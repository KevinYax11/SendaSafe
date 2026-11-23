import 'server-only'

import type { Country, Resource } from '../../shared/directory'
import type { Client } from '@libsql/client'
import { database, storageEnabled } from '../storage'

type Change = {
  id: string
  resource: string | null
  entity_id: number | null
  entity_name: string | null
  archived: number
}
export type ManagedResource = { resource: Resource; entityId: number | null; archived: boolean; bundled: boolean }
export type Entity = { id: number; name: string }

const changesQuery = `
  SELECT directory_changes.*, entities.name AS entity_name
  FROM directory_changes LEFT JOIN entities
    ON entities.id = directory_changes.entity_id AND entities.country = directory_changes.country
  WHERE directory_changes.country = ?
`

export async function managedResources(country: Country, baseline: Resource[], transaction?: Pick<Client, 'execute'>): Promise<ManagedResource[]> {
  const entries = new Map<string, ManagedResource>(
    baseline.map(resource => [resource.id, { resource, entityId: null, archived: false, bundled: true }])
  )
  if (!storageEnabled()) return Array.from(entries.values())
  const result = await (transaction ?? await database()).execute({ sql: changesQuery, args: [country] })
  const changes = result.rows as unknown as Change[]
  for (const change of changes) {
    const original = entries.get(change.id)
    const resource = change.resource ? JSON.parse(change.resource) as Resource : original?.resource
    if (resource) {
      entries.set(change.id, {
        resource: change.entity_name ? { ...resource, organization: change.entity_name } : resource,
        entityId: change.entity_id === null ? null : Number(change.entity_id),
        archived: change.archived === 1,
        bundled: original?.bundled ?? false,
      })
    }
  }
  return Array.from(entries.values())
}

export async function listEntities(country: Country, transaction?: Pick<Client, 'execute'>): Promise<Entity[]> {
  const result = await (transaction ?? await database()).execute({
    sql: 'SELECT id, name FROM entities WHERE country = ? ORDER BY name COLLATE NOCASE', args: [country],
  })
  return result.rows.map(row => ({ id: Number(row.id), name: String(row.name) }))
}

export async function saveEntity(country: Country, id: number | null, name: string) {
  const result = await (await database()).execute(id === null
    ? { sql: 'INSERT OR IGNORE INTO entities (country, name) VALUES (?, ?)', args: [country, name] }
    : { sql: 'UPDATE OR IGNORE entities SET name = ? WHERE country = ? AND id = ?', args: [name, country, id] })
  return result.rowsAffected > 0
}

function channelKey(channel: Resource['channels'][number]) {
  return [channel.type, channel.number, channel.extension ?? ''].join('|')
}

export async function writeResource(
  country: Country, baseline: Resource[], resource: Resource, entityId: number | null, mode: 'create' | 'edit' | 'restore',
) {
  const db = await (await database()).transaction('write')
  try {
    const entries = await managedResources(country, baseline, db)
    const current = entries.find(entry => entry.resource.id === resource.id)
    if (mode === 'create' ? current : !current || current.archived !== (mode === 'restore')) return 'missing'
    if (entityId !== null && !(await listEntities(country, db)).some(entity => entity.id === entityId)) return 'entity'

    const used = new Set(entries.filter(entry => !entry.archived && entry.resource.id !== resource.id)
      .flatMap(entry => entry.resource.channels.map(channelKey)))
    for (const channel of resource.channels) {
      const key = channelKey(channel)
      if (used.has(key)) return 'duplicate'
      used.add(key)
    }

    await db.execute({ sql: `
      INSERT INTO directory_changes (country, id, resource, entity_id, archived) VALUES (?, ?, ?, ?, 0)
      ON CONFLICT (country, id) DO UPDATE SET resource = excluded.resource, entity_id = excluded.entity_id, archived = 0
    `, args: [country, resource.id, JSON.stringify(resource), entityId] })
    await db.commit()
    return 'ok'
  } finally {
    if (!db.closed) await db.rollback()
  }
}

export async function archiveResource(country: Country, resourceId: string) {
  await (await database()).execute({ sql: `
    INSERT INTO directory_changes (country, id, archived) VALUES (?, ?, 1)
    ON CONFLICT (country, id) DO UPDATE SET archived = 1
  `, args: [country, resourceId] })
}
