<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { ROLE_SEGMENT } from '~/utils/workspaceNav'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.isInitialized) {
    await authStore.fetchUser()
  }

  const segment = ROLE_SEGMENT[authStore.role || '']
  await navigateTo(segment ? `/workspace/${segment}` : '/login', { replace: true })
})
</script>

<template>
  <div class="h-screen w-screen bg-alabaster-slate flex items-center justify-center">
    <div
      class="w-6 h-6 border-2 border-scholarly-teal border-t-transparent rounded-full animate-spin"
      role="status"
      aria-label="Mengalihkan ke workspace sesuai role"
    ></div>
  </div>
</template>
