import 'server-only'

import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient, type Client } from '@libsql/client'

const runtime = globalThis as typeof globalThis & { sendasafeDatabase?: Promise<Client> }

export function storageEnabled() {
  return Boolean(process.env.TURSO_DATABASE_URL) || process.env.VERCEL !== '1'
}

const schema = `
      CREATE TABLE IF NOT EXISTS community_comments (
        id INTEGER PRIMARY KEY,
        country TEXT NOT NULL,
        body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 1000),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'rejected')),
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS comments_by_country
        ON community_comments(country, status, id DESC);
      CREATE INDEX IF NOT EXISTS comments_by_status ON community_comments(status, id DESC);
      CREATE INDEX IF NOT EXISTS comments_by_date ON community_comments(country, created_at);

      CREATE TABLE IF NOT EXISTS admin_failures (created_at INTEGER NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY,
        credential_version TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);

      CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY,
        country TEXT NOT NULL,
        name TEXT NOT NULL COLLATE NOCASE,
        UNIQUE(country, name),
        UNIQUE(id, country)
      ) STRICT;

      CREATE TABLE IF NOT EXISTS directory_changes (
        country TEXT NOT NULL,
        id TEXT NOT NULL,
        resource TEXT CHECK(resource IS NULL OR json_valid(resource)),
        entity_id INTEGER,
        archived INTEGER NOT NULL CHECK(archived IN (0, 1)),
        PRIMARY KEY(country, id),
        FOREIGN KEY(entity_id, country) REFERENCES entities(id, country)
      ) STRICT;
`

async function connect() {
  const remote = process.env.TURSO_DATABASE_URL
  if (!storageEnabled()) throw new Error('Persistent storage is not configured')
  let db: Client
  if (remote) {
    // Interactive transactions use a WebSocket connection.
    const url = remote.replace(/^(?:libsql|https):\/\//, 'wss://')
    db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  } else {
    const path = resolve(/* turbopackIgnore: true */ process.env.SENDASAFE_DB_PATH || 'storage/sendasafe.sqlite')
    mkdirSync(dirname(path), { recursive: true })
    db = createClient({ url: pathToFileURL(path).href })
  }
  try {
    if (!remote) {
      await db.execute('PRAGMA busy_timeout = 5000')
      await db.execute('PRAGMA journal_mode = WAL')
      await db.execute('PRAGMA foreign_keys = ON')
    }
    await db.batch(schema.split(';').map(statement => statement.trim()).filter(Boolean), 'write')
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

export function database() {
  runtime.sendasafeDatabase ??= connect().catch(error => {
    delete runtime.sendasafeDatabase
    throw error
  })
  return runtime.sendasafeDatabase
}
