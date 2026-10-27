import { defineNuxtRouteMiddleware, navigateTo, abortNavigation } from '#app'
import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
    await authStore.fetchUser()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({ path: '/login', query: { error: 'login_required' } })
  }

  if (!authStore.isAdmin) {
    return abortNavigation({
      statusCode: 403,
      statusMessage: 'Akses Ditolak: Hanya Administrator yang diizinkan mengakses halaman ini.'
    })
  }
})
