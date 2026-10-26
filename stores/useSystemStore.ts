import { defineStore } from 'pinia'
import type { ApiResponse } from '~/types'

interface SystemHealthState {
  status: string
  version: string
  uptime: number
  driver: string
  provider: string
  userCount: number
  tableCount: number
  lastChecked: string | null
  isLoading: boolean
}

export const useSystemStore = defineStore('system', {
  state: (): SystemHealthState => ({
    status: 'checking',
    version: '1.0.0',
    uptime: 0,
    driver: 'neon-http (serverless)',
    provider: 'Neon PostgreSQL',
    userCount: 0,
    tableCount: 17,
    lastChecked: null,
    isLoading: false
  }),

  actions: {
    async checkHealth() {
      this.isLoading = true
      try {
        const response = await $fetch<ApiResponse<{
          status: string
          version: string
          uptime: number
          database: { driver: string; provider: string; userCount: number; tableCount: number }
        }>>('/api/health')

        if (response.success && response.data) {
          this.status = response.data.status
          this.version = response.data.version
          this.uptime = response.data.uptime
          this.driver = response.data.database.driver
          this.provider = response.data.database.provider
          this.userCount = response.data.database.userCount
          this.tableCount = response.data.database.tableCount
          this.lastChecked = new Date().toLocaleTimeString()
        }
      } catch {
        this.status = 'offline'
      } finally {
        this.isLoading = false
      }
    }
  }
})
