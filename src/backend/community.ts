import 'server-only'

import type { Country } from '../shared/directory'
import { database } from './storage'

type Comment = { id: number; country: Country; body: string; created_at: string }
export type CommentStatus = 'pending' | 'published' | 'rejected'
export const communityPageSize = 20

export async function publishedComments(country: Country, page: number) {
  const result = await (await database()).execute({ sql: `
    SELECT id, country, body, created_at FROM community_comments
    WHERE country = ? AND status = 'published' ORDER BY id DESC LIMIT ? OFFSET ?
  `, args: [country, communityPageSize + 1, (page - 1) * communityPageSize] })
  return result.rows as unknown as Comment[]
}

export async function moderationComments(country: Country, status: CommentStatus, page: number) {
  const result = await (await database()).execute({ sql: `
    SELECT id, country, body, created_at FROM community_comments
    WHERE country = ? AND status = ? ORDER BY id DESC LIMIT ? OFFSET ?
  `, args: [country, status, communityPageSize + 1, (page - 1) * communityPageSize] })
  return result.rows as unknown as Comment[]
}

export async function submitComment(country: Country, body: string) {
  const now = new Date()
  const minuteAgo = new Date(now.getTime() - 60_000).toISOString()
  const dayAgo = new Date(now.getTime() - 86_400_000).toISOString()
  // Both checks and the insert run as a single statement, including across processes.
  const result = await (await database()).execute({ sql: `
    INSERT INTO community_comments (country, body, created_at)
    SELECT ?, ?, ?
    WHERE (SELECT count(*) FROM community_comments WHERE country = ? AND created_at >= ?) < 10
      AND NOT EXISTS (
        SELECT 1 FROM community_comments WHERE country = ? AND created_at >= ? AND body = ?
      )
  `, args: [country, body, now.toISOString(), country, minuteAgo, country, dayAgo, body] })

  return result.rowsAffected > 0
}

export async function moderateComment(country: Country, id: number, from: CommentStatus, to: CommentStatus) {
  const result = await (await database()).execute({ sql: `
    UPDATE community_comments SET status = ? WHERE country = ? AND id = ? AND status = ?
  `, args: [to, country, id, from] })
  return result.rowsAffected > 0
}

export async function removeRejectedComment(country: Country, id: number) {
  const result = await (await database()).execute({
    sql: "DELETE FROM community_comments WHERE country = ? AND id = ? AND status = 'rejected'", args: [country, id],
  })
  return result.rowsAffected > 0
}
