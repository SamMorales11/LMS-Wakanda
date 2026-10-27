import { defineStore } from 'pinia'
import type { AuthSessionUser, LoginInput, AuthResponse, ApiResponse } from '~/types'

interface AuthStoreState {
  user: AuthSessionUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthStoreState => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isInitialized: false
  }),

  getters: {
    currentUser: (state): AuthSessionUser | null => state.user,
    role: (state): string | null => state.user?.role || null,
    isAdmin: (state): boolean => state.user?.role === 'admin',
    isLecturer: (state): boolean => state.user?.role === 'lecturer',
    isStudent: (state): boolean => state.user?.role === 'student',
    nimNidn: (state): string => state.user?.nimNidn || '-',
    displayName: (state): string => state.user?.name || 'Tamu'
  },

  actions: {
    /**
     * Login pengguna dengan email dan password ke endpoint /api/auth/login.
     */
    async login(payload: LoginInput): Promise<AuthSessionUser> {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<ApiResponse<AuthResponse>>('/api/auth/login', {
          method: 'POST',
          body: payload
        })

        if (!response.success || !response.data?.user) {
          throw new Error(response.message || 'Login gagal, periksa email dan password Anda.')
        }

        this.user = response.data.user
        this.isAuthenticated = true
        this.isInitialized = true
        return this.user
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat proses login'
        // Tangkap H3 status message jika ada
        const fetchErr = err as { data?: { statusMessage?: string; message?: string } }
        this.error = fetchErr.data?.statusMessage || fetchErr.data?.message || message
        this.user = null
        this.isAuthenticated = false
        throw new Error(this.error)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Logout pengguna dari sesi saat ini ke endpoint /api/auth/logout.
     */
    async logout(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        await $fetch<ApiResponse<null>>('/api/auth/logout', {
          method: 'POST'
        })
      } catch (err) {
        console.warn('[Auth Store] Logout request warning:', err)
      } finally {
        this.user = null
        this.isAuthenticated = false
        this.isLoading = false
      }
    },

    /**
     * Memuat profil sesi aktif dari endpoint /api/auth/me.
     */
    async fetchUser(): Promise<AuthSessionUser | null> {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<ApiResponse<AuthSessionUser>>('/api/auth/me')
        if (response.success && response.data) {
          this.user = response.data
          this.isAuthenticated = true
          return this.user
        }
        this.user = null
        this.isAuthenticated = false
        return null
      } catch {
        // Unauthenticated session, reset state cleanly
        this.user = null
        this.isAuthenticated = false
        return null
      } finally {
        this.isLoading = false
        this.isInitialized = true
      }
    },

    /**
     * Memastikan state autentikasi terinisialisasi pada booting aplikasi.
     */
    async init(): Promise<void> {
      if (!this.isInitialized) {
        await this.fetchUser()
      }
    }
  }
})
