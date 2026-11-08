import { defineStore } from 'pinia'
import type { User, CreateUserDto, ApiResponse } from '~/types'

interface UserStoreState {
  users: User[]
  selectedUser: User | null
  isLoading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserStoreState => ({
    users: [],
    selectedUser: null,
    isLoading: false,
    error: null
  }),

  getters: {
    adminCount: (state): number => state.users.filter(u => u.role === 'admin').length,
    lecturerCount: (state): number => state.users.filter(u => u.role === 'lecturer').length,
    studentCount: (state): number => state.users.filter(u => u.role === 'student').length,
    totalUsers: (state): number => state.users.length
  },

  actions: {
    async fetchUsers(filter?: { role?: string; search?: string } | string) {
      this.isLoading = true
      this.error = null
      try {
        let query = ''
        if (typeof filter === 'string' && filter) {
          query = `?role=${filter}`
        } else if (filter && typeof filter === 'object') {
          const params = new URLSearchParams()
          if (filter.role) params.append('role', filter.role)
          if (filter.search) params.append('search', filter.search)
          const qs = params.toString()
          if (qs) query = `?${qs}`
        }

        const response = await $fetch<ApiResponse<User[]>>(`/api/users${query}`)
        if (response.success && response.data) {
          this.users = response.data
        }
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch users'
      } finally {
        this.isLoading = false
      }
    },

    async createUser(payload: CreateUserDto) {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<User>>('/api/users', {
          method: 'POST',
          body: payload
        })
        if (response.success && response.data) {
          this.users.unshift(response.data)
          return response.data
        }
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to create user'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async resetUserPassword(userId: string, newPassword?: string) {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<{ success: boolean; message: string }>>(`/api/users/${userId}/reset-password`, {
          method: 'POST',
          body: { newPassword }
        })
        if (!response.success) {
          throw new Error(response.message || 'Gagal mereset kata sandi')
        }
        return response.data || { success: true, message: response.message }
      } catch (err: unknown) {
        const fetchErr = err as { data?: { statusMessage?: string; message?: string } }
        const message = fetchErr.data?.statusMessage || fetchErr.data?.message || (err instanceof Error ? err.message : 'Gagal mereset kata sandi')
        this.error = message
        throw new Error(message)
      } finally {
        this.isLoading = false
      }
    },

    async deleteUser(userId: string) {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<{ id: string; deleted: boolean }>>(`/api/users/${userId}`, {
          method: 'DELETE'
        })
        if (response.success) {
          this.users = this.users.filter(u => u.id !== userId)
          return response.data
        }
      } catch (err: unknown) {
        const fetchErr = err as { data?: { statusMessage?: string; message?: string } }
        const message = fetchErr.data?.statusMessage || fetchErr.data?.message || (err instanceof Error ? err.message : 'Gagal menghapus pengguna')
        this.error = message
        throw new Error(message)
      } finally {
        this.isLoading = false
      }
    },

    setSelectedUser(user: User | null) {
      this.selectedUser = user
    }
  }
})
