<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import type { WorkspaceNavItem, WorkspaceSectionId } from '~/utils/workspaceNav'

const props = defineProps<{
  sections: WorkspaceNavItem[]
  activeSection: WorkspaceSectionId
}>()

const emit = defineEmits<{
  (e: 'update:activeSection', section: WorkspaceSectionId): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const academicStore = useAcademicStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const activeClassId = computed(() => academicStore.selectedClassId)

const roleLabel = computed(() => {
  if (authStore.isAdmin) return 'Administrator'
  if (authStore.isLecturer) return 'Dosen'
  return 'Mahasiswa'
})
</script>

<template>
  <aside class="w-full lg:w-72 bg-white border-r border-slate-200/80 flex flex-col h-full shrink-0">
    <!-- Identitas Institusi -->
    <div class="p-5 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-lg bg-academic-navy text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 font-jakarta"
        >
          ITW
        </div>
        <div class="min-w-0">
          <h1 class="text-xs font-bold text-academic-navy tracking-tight font-jakarta truncate">
            Institut Teknologi Wakanda
          </h1>
          <p class="text-[11px] text-slate-500 font-inter truncate">Wakanda Academic Space</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-5 space-y-6">
      <!-- KONTEKS: Semester Aktif -->
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2">Konteks</span>
        <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-alabaster-slate border border-slate-200">
          <span class="text-xs text-slate-700 font-semibold truncate">
            {{ academicStore.activeTerm?.name || 'Semester Aktif' }}
          </span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
            {{ academicStore.activeTerm?.code || '—' }}
          </span>
        </div>
      </div>

      <!-- NAVIGASI: Section Milik Role Tersebut -->
      <div class="space-y-1">
        <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2">Navigasi</span>
        <button
          v-for="item in props.sections"
          :key="item.id"
          type="button"
          @click="emit('update:activeSection', item.id)"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium font-inter transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-scholarly-teal/40"
          :class="props.activeSection === item.id
            ? 'bg-academic-navy text-white'
            : 'text-slate-700 hover:bg-slate-100'"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>

      <!-- DAFTAR KELAS PERKULIAHAN -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-2">
          <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Kelas Perkuliahan</span>
          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
            {{ academicStore.classes.length }}
          </span>
        </div>

        <div v-if="academicStore.isLoading" class="p-4 text-center space-y-2">
          <div class="w-5 h-5 border-2 border-scholarly-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span class="text-xs text-slate-400 font-inter">Memuat kelas...</span>
        </div>

        <div
          v-else-if="academicStore.classes.length === 0"
          class="p-4 text-center text-xs text-slate-400 font-inter bg-slate-50 rounded-xl"
        >
          Belum ada kelas paralel terdaftar.
        </div>

        <div v-else class="space-y-1.5">
          <button
            v-for="item in academicStore.classes"
            :key="item.id"
            type="button"
            @click="academicStore.selectClass(item.id)"
            class="w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 font-inter focus:outline-none focus-visible:ring-2 focus-visible:ring-scholarly-teal/40"
            :class="activeClassId === item.id
              ? 'bg-alabaster-slate border-scholarly-teal text-deep-ink'
              : 'bg-white border-slate-200/90 hover:bg-slate-50 text-slate-700'"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold font-jakarta text-academic-navy truncate">
                {{ item.courseCode || 'MATA KULIAH' }}
              </span>
              <span
                class="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                :class="activeClassId === item.id ? 'bg-scholarly-teal text-white' : 'bg-slate-100 text-slate-700'"
              >
                {{ item.code }}
              </span>
            </div>

            <p class="text-xs font-medium text-slate-800 line-clamp-1 leading-snug">
              {{ item.courseName || item.code }}
            </p>

            <div class="flex items-center gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
              <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span class="truncate">{{ item.room || 'Lab Utama' }}</span>
              <span aria-hidden="true">·</span>
              <span class="truncate font-mono">{{ item.scheduleDay || 'Senin' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Profil Sesi Pengguna -->
    <div class="p-4 border-t border-slate-200/80 bg-slate-50/70">
      <div v-if="authStore.isAuthenticated && authStore.user" class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs font-jakarta shrink-0"
            :class="{
              'bg-academic-navy': authStore.isAdmin,
              'bg-scholarly-teal': authStore.isLecturer,
              'bg-slate-700': authStore.isStudent
            }"
          >
            {{ authStore.user.name.charAt(0) }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-deep-ink font-jakarta truncate">
              {{ authStore.user.name }}
            </p>
            <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <span class="truncate">{{ roleLabel }}</span>
              <span aria-hidden="true">·</span>
              <span class="truncate">{{ authStore.user.nimNidn || '-' }}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="handleLogout"
          title="Keluar dari Akun"
          class="p-2 rounded-lg text-slate-400 hover:text-semantic-danger hover:bg-red-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-scholarly-teal/40"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <div v-else class="flex items-center justify-between">
        <div class="text-xs text-slate-500 font-inter">
          <span class="block font-semibold text-slate-700">Sesi Tamu</span>
          <span class="text-[10px]">Akses Terbatas</span>
        </div>
        <NuxtLink
          to="/login"
          class="px-3 py-1.5 rounded-lg bg-academic-navy text-white text-xs font-semibold hover:bg-blue-900 transition font-inter"
        >
          Login
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>
