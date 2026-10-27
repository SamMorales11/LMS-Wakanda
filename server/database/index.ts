import { Pool, neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

// Connection pool supporting stateful ACID database transactions over WebSocket
export const pool = new Pool({ connectionString })

// Drizzle ORM instance with strict typed schema & transaction support
export const db = drizzle(pool, { schema })

// Neon serverless raw SQL query client
export const sql = neon(connectionString)

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
