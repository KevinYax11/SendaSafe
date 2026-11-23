import 'server-only'

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { database, storageEnabled } from './storage'

const sessionCookie = 'sendasafe_admin'
const sessionSeconds = 8 * 60 * 60
const failureWindow = 15 * 60 * 1000
const failureLimit = 8

function credentials() {
  const password = process.env.SENDASAFE_ADMIN_PASSWORD
  const secret = process.env.SENDASAFE_SESSION_SECRET
  return storageEnabled() && password && password.length >= 16 && secret && secret.length >= 32
    ? { password, secret }
    : null
}

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update(`sendasafe.admin.v1:${payload}`).digest('hex')
}

function equal(left: string, right: string) {
  return timingSafeEqual(createHash('sha256').update(left).digest(), createHash('sha256').update(right).digest())
}

export function adminConfigured() {
  return credentials() !== null
}

export async function isAdmin() {
  const configuration = credentials()
  const token = (await cookies()).get(sessionCookie)?.value
  if (!configuration || !token || !/^[a-f0-9]{64}$/.test(token)) return false
  const { password, secret } = configuration
  const session = await (await database()).execute({
    sql: 'SELECT 1 FROM admin_sessions WHERE token_hash = ? AND credential_version = ? AND expires_at > ?',
    args: [signature(token, secret), signature(`credential:${password}`, secret), Date.now()],
  })
  return session.rows.length === 1
}

export async function authenticate(candidate: string) {
  const configuration = credentials()
  if (!configuration) return 'disabled'
  const { password, secret } = configuration
  const db = await database()
  const now = Date.now()
  // Expired attempts are removed and the limit is applied atomically for concurrent attempts.
  await db.execute({ sql: 'DELETE FROM admin_failures WHERE created_at < ?', args: [now - failureWindow] })
  const correct = equal(candidate, password)
  if (!correct) {
    const attempt = await db.execute({ sql: `
      INSERT INTO admin_failures
      SELECT ? WHERE (SELECT count(*) FROM admin_failures) < ?
    `, args: [now, failureLimit] })
    return attempt.rowsAffected ? 'invalid' : 'limited'
  }

  const attempts = (await db.execute('SELECT count(*) AS total FROM admin_failures')).rows[0]?.total
  if (Number(attempts) >= failureLimit) return 'limited'
  const token = randomBytes(32).toString('hex')
  await db.batch([
    'DELETE FROM admin_failures',
    { sql: 'DELETE FROM admin_sessions WHERE expires_at <= ?', args: [now] },
    {
      sql: 'INSERT INTO admin_sessions (token_hash, credential_version, expires_at) VALUES (?, ?, ?)',
      args: [signature(token, secret), signature(`credential:${password}`, secret), now + sessionSeconds * 1000],
    },
  ], 'write')
  const origin = (await headers()).get('origin')
  const local = origin !== null && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const jar = await cookies()
  jar.set(sessionCookie, token, {
    httpOnly: true, sameSite: 'strict', secure: !local, path: '/admin', maxAge: sessionSeconds,
  })
  return 'ok'
}

export async function clearAdminSession() {
  const jar = await cookies()
  const configuration = credentials()
  const token = jar.get(sessionCookie)?.value
  if (configuration && token) {
    await (await database()).execute({
      sql: 'DELETE FROM admin_sessions WHERE token_hash = ?', args: [signature(token, configuration.secret)],
    })
  }
  jar.set(sessionCookie, '', { path: '/admin', maxAge: 0 })
}
