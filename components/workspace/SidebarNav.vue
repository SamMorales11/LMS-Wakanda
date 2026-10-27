<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'

defineProps<{
  activeMainTab: 'workspace' | 'grades' | 'architecture'
}>()

const emit = defineEmits<{
  (e: 'update:activeMainTab', tab: 'workspace' | 'grades' | 'architecture'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const academicStore = useAcademicStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const activeClassId = computed(() => academicStore.selectedClassId)
</script>

<template>
  <aside class="w-full lg:w-72 xl:w-80 bg-white border-r border-slate-200/80 flex flex-col justify-between h-full shrink-0 shadow-sm">
    <!-- Bagian Atas: Identitas & Semester -->
    <div class="p-5 border-b border-slate-100 space-y-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-academic-navy text-white flex items-center justify-center font-extrabold text-base shadow-sm font-mono tracking-wider shrink-0">
          ITW
        </div>
        <div class="min-w-0">
          <h1 class="text-sm font-bold text-academic-navy tracking-tight font-jakarta truncate">
            Institut Teknologi Wakanda
          </h1>
          <p class="text-[11px] text-slate-500 font-inter truncate">
            Wakanda Academic Space (WAS)
          </p>
        </div>
      </div>

      <!-- Badge Semester Aktif -->
      <div class="p-2.5 rounded-xl bg-alabaster-slate border border-slate-200 flex items-center justify-between text-xs font-inter">
        <div class="flex items-center space-x-2 truncate">
          <span class="w-2 h-2 rounded-full bg-scholarly-teal shrink-0"></span>
          <span class="text-slate-700 font-semibold truncate">
            {{ academicStore.activeTerm?.name || 'T.A. 2026/2027 Ganjil' }}
          </span>
        </div>
        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-scholarly-teal font-bold border border-teal-200/60">
          {{ academicStore.activeTerm?.code || '20261' }}
        </span>
      </div>
    </div>

    <!-- Bagian Tengah: Menu Navigasi & Daftar Kelas Paralel -->
    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      <!-- Menu Utama -->
      <div class="space-y-1">
        <span class="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase px-2">
          Menu Navigasi
        </span>

        <button
          type="button"
          @click="emit('update:activeMainTab', 'workspace')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium font-inter transition text-left"
          :class="activeMainTab === 'workspace' ? 'bg-academic-navy text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span class="truncate">Workspace 16 Pertemuan</span>
        </button>

        <button
          type="button"
          @click="emit('update:activeMainTab', 'grades')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium font-inter transition text-left"
          :class="activeMainTab === 'grades' ? 'bg-academic-navy text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="truncate">Bobot Nilai & Evaluasi</span>
        </button>

        <button
          type="button"
          @click="emit('update:activeMainTab', 'architecture')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium font-inter transition text-left"
          :class="activeMainTab === 'architecture' ? 'bg-academic-navy text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="truncate">Arsitektur & RBAC Tester</span>
        </button>
      </div>

      <!-- Daftar Kelas Semester Aktif (Rombongan Belajar) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-2">
          <span class="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
            Kelas Perkuliahan Aktif
          </span>
          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
            {{ academicStore.classes.length }} Rombel
          </span>
        </div>

        <div v-if="academicStore.isLoading" class="p-4 text-center space-y-2">
          <div class="w-5 h-5 border-2 border-scholarly-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span class="text-xs text-slate-400 font-inter">Memuat kelas...</span>
        </div>

        <div v-else-if="academicStore.classes.length === 0" class="p-4 text-center text-xs text-slate-400 font-inter bg-slate-50 rounded-xl">
          Belum ada kelas paralel terdaftar.
        </div>

        <div v-else class="space-y-1.5">
          <button
            v-for="item in academicStore.classes"
            :key="item.id"
            type="button"
            @click="academicStore.selectClass(item.id)"
            class="w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 font-inter"
            :class="activeClassId === item.id
              ? 'bg-teal-50/70 border-scholarly-teal text-deep-ink shadow-xs'
              : 'bg-white border-slate-200/90 hover:bg-slate-50 text-slate-700'"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold font-jakarta text-academic-navy">
                {{ item.courseCode || 'MATA KULIAH' }}
              </span>
              <span
                class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                :class="activeClassId === item.id ? 'bg-scholarly-teal text-white' : 'bg-slate-100 text-slate-700'"
              >
                Kelas {{ item.code }}
              </span>
            </div>

            <p class="text-xs font-medium text-slate-800 line-clamp-1 leading-snug">
              {{ item.courseName || item.code }}
            </p>

            <div class="flex items-center gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
              <span class="truncate">📍 {{ item.room || 'Lab Utama' }}</span>
              <span>•</span>
              <span class="truncate font-mono">{{ item.scheduleDay || 'Senin' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Bagian Bawah: Profil Sesi Pengguna & Tombol Keluar -->
    <div class="p-4 border-t border-slate-200/80 bg-slate-50/70 space-y-3">
      <div v-if="authStore.isAuthenticated && authStore.user" class="flex items-center justify-between">
        <div class="flex items-center space-x-2.5 min-w-0">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs font-mono shrink-0 shadow-xs"
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
              <span
                class="px-1.5 py-0.2 rounded font-semibold uppercase text-[9px]"
                :class="{
                  'bg-blue-100 text-blue-800': authStore.isAdmin,
                  'bg-teal-100 text-teal-800': authStore.isLecturer,
                  'bg-slate-200 text-slate-700': authStore.isStudent
                }"
              >
                {{ authStore.user.role }}
              </span>
              <span class="truncate">{{ authStore.user.nimNidn || '-' }}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="handleLogout"
          title="Keluar dari Akun"
          class="p-2 rounded-lg text-slate-400 hover:text-semantic-danger hover:bg-red-50 transition"
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
