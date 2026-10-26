import type { User } from '~/types'

export interface DatabaseState {
  users: Map<string, User>
  meta: {
    initializedAt: string
    driver: 'memory' | 'sqlite' | 'postgres'
  }
}

export interface IDatabaseConnection {
  users: Map<string, User>
  ping(): Promise<boolean>
}
