import { count } from 'drizzle-orm'
import { db, pingDatabase, users } from '../database'

export interface SystemHealthInfo {
  status: 'healthy' | 'degraded' | 'unhealthy'
  name: string
  version: string
  uptime: number
  environment: string
  database: {
    connected: boolean
    driver: string
    userCount: number
    tableCount: number
    provider: string
  }
  timestamp: string
}

export class SystemService {
  private readonly startTime = Date.now()

  public async getHealth(): Promise<SystemHealthInfo> {
    const isDbAlive = await pingDatabase()
    let userCount = 0

    if (isDbAlive) {
      try {
        const result = await db.select({ value: count() }).from(users)
        userCount = Number(result[0]?.value || 0)
      } catch (err) {
        console.error('[Healthcheck User Count Error]:', err)
      }
    }

    return {
      status: isDbAlive ? 'healthy' : 'degraded',
      name: 'LMS Wakanda Core API',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: isDbAlive,
        driver: 'neon-http (serverless)',
        provider: 'Neon PostgreSQL',
        userCount,
        tableCount: 17
      },
      timestamp: new Date().toISOString()
    }
  }
}

export const systemService = new SystemService()
