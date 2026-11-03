import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/useAuthStore'
import { ROLE_SEGMENT } from '~/utils/workspaceNav'

/**
 * Middleware penjaga role untuk route workspace terpisah.
 * Route mendeklarasikan role yang diizinkan lewat `definePageMeta({ requiredRole })`.
 * Role yang tidak cocok diarahkan ke workspace miliknya sendiri, bukan ke halaman kosong.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
    await authStore.fetchUser()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath, error: 'auth_required' }
    })
  }

  const requiredRole = to.meta.requiredRole as string | undefined
  if (!requiredRole) return

  if (authStore.role === requiredRole) return

  const ownSegment = ROLE_SEGMENT[authStore.role || '']
  if (!ownSegment) {
    return navigateTo({ path: '/login', query: { error: 'unknown_role' } })
  }

  return navigateTo(`/workspace/${ownSegment}`, { replace: true })
})
