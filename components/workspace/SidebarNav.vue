<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import ChangePasswordModal from '~/components/workspace/ChangePasswordModal.vue'
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

const showChangePasswordModal = ref(false)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const activeClassId = computed(() => academicStore.selectedClassId)

const displayedClasses = computed(() => {
  if (authStore.isLecturer && authStore.user?.id) {
    return academicStore.classes.filter(c => c.lecturerId === authStore.user?.id)
  }
  return academicStore.classes
})

// Otomatis memilih kelas pertama yang diampu dosen saat berganti akun dosen atau saat kelas aktif tidak valid
watch(
  () => [authStore.user?.id, displayedClasses.value],
  () => {
    if (authStore.isLecturer && displayedClasses.value.length > 0) {
      const currentSelected = academicStore.selectedClassId
      const isValid = currentSelected && displayedClasses.value.some(c => c.id === currentSelected)
      if (!isValid) {
        academicStore.selectClass(displayedClasses.value[0].id)
      }
    }
  },
  { immediate: true }
)

const roleLabel = computed(() => {
  if (authStore.isAdmin) return 'Administrator'
  if (authStore.isLecturer) return 'Dosen'
  return 'Mahasiswa'
})
</script>

<template>
  <aside class="w-full lg:w-72 bg-[#0F172A] border-r border-slate-800 flex flex-col h-full shrink-0 text-slate-200 select-none">
    <!-- Identitas Institusi -->
    <div class="p-4 sm:p-5 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-sm bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 font-mono border border-teal-500/40"
        >
          ITW
        </div>
        <div class="min-w-0">
          <h1 class="text-xs font-bold text-white tracking-tight font-jakarta truncate">
            Institut Teknologi Wakanda
          </h1>
          <p class="text-[11px] text-teal-400 font-mono truncate">Wakanda Academic Space</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
      <!-- KONTEKS: Semester Aktif -->
      <div class="space-y-1.5">
        <span class="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase px-2">Konteks</span>
        <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-sm bg-slate-900 border border-slate-800">
          <span class="text-xs text-slate-300 font-semibold truncate">
            {{ academicStore.activeTerm?.name || 'Semester Aktif' }}
          </span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-teal-400 border border-slate-700 shrink-0 font-bold">
            {{ academicStore.activeTerm?.code || '\u2014' }}
          </span>
        </div>
      </div>

      <!-- NAVIGASI: Section Milik Role Tersebut -->
      <div class="space-y-1">
        <span class="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase px-2">Navigasi</span>
        <button
          v-for="item in props.sections"
          :key="item.id"
          type="button"
          @click="emit('update:activeSection', item.id)"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium font-inter transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          :class="props.activeSection === item.id
            ? 'bg-[#1E3A8A] text-white border-l-2 border-[#0D9488] font-semibold'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>

      <!-- DAFTAR KELAS PERKULIAHAN (Hanya untuk Dosen & Mahasiswa) -->
      <div v-if="!authStore.isAdmin" class="space-y-2">
        <div class="flex items-center justify-between px-2">
          <span class="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Kelas Perkuliahan</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
            {{ displayedClasses.length }}
          </span>
        </div>

        <div v-if="academicStore.isLoading" class="p-4 text-center space-y-2">
          <div class="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span class="text-xs text-slate-400 font-inter">Memuat kelas...</span>
        </div>

        <div
          v-else-if="displayedClasses.length === 0"
          class="p-4 text-center text-xs text-slate-400 font-inter bg-slate-900 rounded-sm border border-slate-800"
        >
          {{ authStore.isLecturer ? 'Belum ada kelas perkuliahan yang diampu.' : 'Belum ada kelas paralel terdaftar.' }}
        </div>

        <div v-else class="space-y-1.5">
          <button
            v-for="item in displayedClasses"
            :key="item.id"
            type="button"
            @click="academicStore.selectClass(item.id)"
            class="w-full text-left p-2.5 rounded-sm border transition flex flex-col gap-1 font-inter focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            :class="activeClassId === item.id
              ? 'bg-slate-900 border-l-2 border-l-[#0D9488] border-y border-r border-slate-700 text-white'
              : 'bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs font-bold font-jakarta truncate"
                :class="activeClassId === item.id ? 'text-teal-300' : 'text-slate-200'"
              >
                {{ item.courseCode || 'MATA KULIAH' }}
              </span>
              <span
                class="text-[10px] font-mono px-1.5 py-0.5 rounded-sm shrink-0"
                :class="activeClassId === item.id
                  ? 'bg-[#0D9488] text-white font-bold'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'"
              >
                {{ item.code }}
              </span>
            </div>

            <p
              class="text-xs font-medium line-clamp-1 leading-snug"
              :class="activeClassId === item.id ? 'text-slate-100' : 'text-slate-400'"
            >
              {{ item.courseName || item.code }}
            </p>

            <div class="flex items-center gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-800/70">
              <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span class="truncate">{{ item.room || 'Lab Utama' }}</span>
              <span aria-hidden="true">&middot;</span>
              <span class="truncate font-mono">{{ item.scheduleDay || 'Senin' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Profil Sesi Pengguna -->
    <div class="p-3.5 border-t border-slate-800 bg-slate-950/70">
      <div v-if="authStore.isAuthenticated && authStore.user" class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-8 h-8 rounded-sm flex items-center justify-center font-bold text-white text-xs font-jakarta shrink-0"
            :class="{
              'bg-[#1E3A8A] border border-teal-500/40': authStore.isAdmin,
              'bg-[#0D9488]': authStore.isLecturer,
              'bg-slate-700': authStore.isStudent
            }"
          >
            {{ authStore.user.name.charAt(0) }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-white font-jakarta truncate">
              {{ authStore.user.name }}
            </p>
            <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span class="truncate">{{ roleLabel }}</span>
              <span aria-hidden="true">&middot;</span>
              <span class="truncate">{{ authStore.user.nimNidn || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            @click="showChangePasswordModal = true"
            title="Ubah Kata Sandi Mandiri"
            class="p-2 rounded-sm text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <!-- Monochrome line-art SVG key icon -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </button>

          <button
            type="button"
            @click="handleLogout"
            title="Keluar dari Akun"
            class="p-2 rounded-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="flex items-center justify-between">
        <div class="text-xs text-slate-400 font-inter">
          <span class="block font-semibold text-slate-200">Sesi Tamu</span>
          <span class="text-[10px]">Akses Terbatas</span>
        </div>
        <NuxtLink
          to="/login"
          class="px-3 py-1.5 rounded-sm bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-blue-900 transition font-inter"
        >
          Login
        </NuxtLink>
      </div>
    </div>

    <!-- Modal Ubah Kata Sandi Mandiri -->
    <ChangePasswordModal
      :is-open="showChangePasswordModal"
      @close="showChangePasswordModal = false"
    />
  </aside>
</template>
