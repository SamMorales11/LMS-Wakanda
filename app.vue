<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.fetchUser()
})
</script>

<template>
  <div class="min-h-screen bg-alabaster-slate text-deep-ink font-sans antialiased selection:bg-scholarly-teal/20 selection:text-scholarly-teal">
    <NuxtPage />
  </div>
</template>
