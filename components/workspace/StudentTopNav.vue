<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { NAV_ICONS, type WorkspaceNavItem, type WorkspaceSectionId } from '~/utils/workspaceNav'
import type { CourseClassDto } from '~/types'
import ChangePasswordModal from './ChangePasswordModal.vue'

defineProps<{
  sections: WorkspaceNavItem[]
  activeSection: WorkspaceSectionId
}>()

const emit = defineEmits<{
  (e: 'update:activeSection', section: WorkspaceSectionId): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const academicStore = useAcademicStore()

const showChangePasswordModal = ref(false)

const enrolledClasses = computed(() => academicStore.classes)
const selectedClassId = computed(() => academicStore.selectedClassId)

const DAY_TRANSLATIONS: Record<string, string> = {
  monday: 'SENIN',
  tuesday: 'SELASA',
  wednesday: 'RABU',
  thursday: 'KAMIS',
  friday: 'JUMAT',
  saturday: 'SABTU',
  sunday: 'MINGGU'
}

const formatScheduleDay = (day?: string | null) => {
  if (!day) return 'SENIN'
  const clean = day.trim().toLowerCase()
  return DAY_TRANSLATIONS[clean] || day.toUpperCase()
}

const formatTimeNoSeconds = (time?: string | null, fallback = '08:00') => {
  if (!time) return fallback
  return time.trim().slice(0, 5)
}

const getClassOptionLabel = (c: CourseClassDto) => {
  const courseCode = c.courseCode || 'MK'
  const courseName = c.courseName || 'Mata Kuliah'
  const classCode = c.code ? `Kelas ${c.code}` : ''
  const day = formatScheduleDay(c.scheduleDay)
  const startTime = formatTimeNoSeconds(c.scheduleStart, '08:00')
  const endTime = formatTimeNoSeconds(c.scheduleEnd, '11:30')
  return `${courseCode} · ${courseName} (${classCode}) — ${day} ${startTime} - ${endTime}`
}

const handleClassChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  if (target.value && target.value !== selectedClassId.value) {
    academicStore.selectClass(target.value)
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-white border-b border-slate-200/90 shrink-0 z-30 shadow-xs">
    <div class="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <!-- 1. KIRI: Brand ITW & Dropdown Kelas Enrolled -->
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <!-- Brand ITW Chip -->
        <div class="flex items-center gap-2.5 shrink-0">
          <span
            class="px-2 py-0.5 rounded-sm bg-[#1E3A8A] text-white font-mono text-[11px] font-bold tracking-wider border border-teal-500/30 shrink-0 shadow-xs"
          >
            ITW
          </span>
          <div class="hidden xl:block min-w-0">
            <h1 class="text-xs font-bold text-[#0F172A] font-jakarta truncate">
              Institut Teknologi Wakanda
            </h1>
            <p class="text-[10px] text-slate-500 font-mono truncate">
              Student Learning Portal &bull; {{ academicStore.activeTerm ? `${academicStore.activeTerm.code}` : '20261' }}
            </p>
          </div>
        </div>

        <span class="hidden md:inline-block w-px h-6 bg-slate-200 shrink-0"></span>

        <!-- Dropdown Pemilih Kelas Enrolled Mahasiswa -->
        <div class="min-w-0 relative max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-md">
          <label for="student-class-select" class="sr-only">Pilih Kelas Perkuliahan</label>
          <div class="relative flex items-center">
            <select
              id="student-class-select"
              :value="selectedClassId"
              @change="handleClassChange"
              :disabled="enrolledClasses.length === 0"
              class="w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold text-[#0F172A] bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-sm truncate transition focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:opacity-60 cursor-pointer"
            >
              <option v-if="enrolledClasses.length === 0" value="" disabled>
                Tidak ada kelas terdaftar
              </option>
              <option
                v-for="c in enrolledClasses"
                :key="c.id"
                :value="c.id"
              >
                {{ getClassOptionLabel(c) }}
              </option>
            </select>
            <div class="pointer-events-none absolute right-2.5 text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. TENGAH: 4 Tab Navigasi Horizontal Mahasiswa -->
      <nav class="hidden lg:flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar">
        <button
          v-for="item in sections"
          :key="item.id"
          type="button"
          @click="emit('update:activeSection', item.id)"
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-inter transition rounded-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          :class="activeSection === item.id
            ? 'bg-blue-50 text-[#1E3A8A] font-bold border-b-2 border-[#1E3A8A] shadow-2xs'
            : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 border-b-2 border-transparent'"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="NAV_ICONS[item.id] || item.icon" />
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- 3. KANAN: Profil Mahasiswa + Aksi Ubah Sandi & Logout -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Profil Ringkas -->
        <div v-if="authStore.user" class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-8 h-8 rounded-sm bg-[#1E3A8A] border border-teal-500/30 flex items-center justify-center font-bold text-white text-xs font-jakarta shrink-0 shadow-xs"
          >
            {{ authStore.user.name ? authStore.user.name.charAt(0) : 'M' }}
          </div>
          <div class="hidden sm:block min-w-0 text-left">
            <p class="text-xs font-bold text-[#0F172A] font-jakarta truncate max-w-[140px]">
              {{ authStore.user.name }}
            </p>
            <p class="text-[10px] font-mono text-slate-500 truncate">
              NIM {{ authStore.user.nimNidn || '-' }}
            </p>
          </div>
        </div>

        <span class="w-px h-6 bg-slate-200 shrink-0"></span>

        <!-- Tombol Aksi: Ubah Sandi -->
        <button
          type="button"
          @click="showChangePasswordModal = true"
          title="Ubah Kata Sandi Mandiri"
          class="p-2 rounded-sm text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </button>

        <!-- Tombol Aksi: Logout -->
        <button
          type="button"
          @click="handleLogout"
          title="Keluar dari Akun"
          class="p-2 rounded-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Sub-bar Tab Navigasi untuk Layar < lg -->
    <div class="lg:hidden border-t border-slate-200/80 px-4 py-1.5 bg-slate-50 flex items-center gap-1 overflow-x-auto no-scrollbar">
      <button
        v-for="item in sections"
        :key="item.id"
        type="button"
        @click="emit('update:activeSection', item.id)"
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-inter transition rounded-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        :class="activeSection === item.id
          ? 'bg-white text-[#1E3A8A] font-bold border border-slate-200 shadow-2xs'
          : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/50'"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="NAV_ICONS[item.id] || item.icon" />
        </svg>
        <span>{{ item.label }}</span>
      </button>
    </div>

    <!-- Modal Ubah Sandi Mandiri -->
    <ChangePasswordModal
      :is-open="showChangePasswordModal"
      @close="showChangePasswordModal = false"
    />
  </header>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
