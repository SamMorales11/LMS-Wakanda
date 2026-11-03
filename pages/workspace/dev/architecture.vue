<script setup lang="ts">
import ArchitectureInspector from '~/components/workspace/dev/ArchitectureInspector.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'admin'
})
</script>

<template>
  <div class="min-h-screen bg-alabaster-slate text-deep-ink font-sans antialiased">
    <header class="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-xs font-semibold text-academic-navy font-jakarta">Alat Diagnostik Internal</p>
        <p class="truncate text-[11px] text-slate-500 font-mono">
          Halaman pengembangan · tidak terhubung ke navigasi pengguna
        </p>
      </div>
      <NuxtLink
        to="/workspace/admin"
        class="shrink-0 px-3 py-1.5 rounded-xl bg-academic-navy text-white text-xs font-semibold hover:bg-blue-900 transition font-jakarta"
      >
        Kembali ke Workspace
      </NuxtLink>
    </header>

    <ArchitectureInspector />
  </div>
</template>
