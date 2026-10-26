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
    async fetchUsers(role?: string) {
      this.isLoading = true
      this.error = null
      try {
        const query = role ? `?role=${role}` : ''
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

    setSelectedUser(user: User | null) {
      this.selectedUser = user
    }
  }
})
