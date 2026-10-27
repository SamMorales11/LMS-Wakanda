import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Pastikan sesi termuat saat pertama kali membuka halaman
  if (!authStore.isInitialized) {
    await authStore.fetchUser()
  }

  // Jika belum login, redirect ke halaman login
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath, error: 'auth_required' }
    })
  }
})
