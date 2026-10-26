import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

// Neon serverless SQL query client
export const sql = neon(connectionString)

// Drizzle ORM instance with strict typed schema
export const db = drizzle(sql, { schema })

export type DatabaseInstance = typeof db

/**
 * Healthcheck ping for Neon Serverless database.
 */
export const pingDatabase = async (): Promise<boolean> => {
  try {
    const result = await sql.query('SELECT 1 as connected')
    return Array.isArray(result) && result.length > 0
  } catch (error) {
    console.error('[Neon Database Connection Error]:', error)
    return false
  }
}

// Re-export schema entities, relations, enums, and inferred types
export * from './schema'
