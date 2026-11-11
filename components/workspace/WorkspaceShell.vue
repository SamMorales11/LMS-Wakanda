<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import SidebarNav from './SidebarNav.vue'
import ContextualPanel from './ContextualPanel.vue'
import OnlineExamModal from './OnlineExamModal.vue'
import type { WorkspaceNavItem, WorkspaceSectionId } from '~/utils/workspaceNav'

const props = defineProps<{
  sections: WorkspaceNavItem[]
  defaultSection: WorkspaceSectionId
}>()

const authStore = useAuthStore()
const academicStore = useAcademicStore()

const activeSection = ref<WorkspaceSectionId>(props.defaultSection)

watch(
  () => props.defaultSection,
  (value) => {
    activeSection.value = value
  }
)

const activeNavItem = computed(
  () => props.sections.find(item => item.id === activeSection.value) || props.sections[0]
)

const currentClass = computed(() => academicStore.selectedClassDetail || academicStore.selectedClass)

// Contextual Split Layout: Panel kanan hanya relevan di tab 'sessions' (Struktur Pertemuan)
const isSessionsSection = computed(() => activeSection.value === 'sessions')
const shouldShowContextualPanel = computed(() => !authStore.isAdmin && isSessionsSection.value)

// State Drawer Mobile
const isMobileSidebarOpen = ref(false)
const isMobilePanelOpen = ref(false)

// State Panel Kanan yang Dapat Dilipat
const PANEL_STATE_KEY = 'wakanda.workspace.panelCollapsed'
const isPanelCollapsed = ref(false)

onMounted(async () => {
  isPanelCollapsed.value = localStorage.getItem(PANEL_STATE_KEY) === 'true'

  await Promise.all([
    authStore.fetchUser(),
    academicStore.initWorkspace()
  ])
})

const togglePanelCollapsed = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value
  localStorage.setItem(PANEL_STATE_KEY, String(isPanelCollapsed.value))
}
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased">
    <!-- Top Bar Minimal: Konteks Akademik + Section Aktif + Kendali Panel -->
    <header class="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30">
      <div class="flex items-center gap-3 min-w-0">
        <button
          type="button"
          @click="isMobileSidebarOpen = true"
          class="lg:hidden p-2 -ml-2 rounded-sm text-slate-600 hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          title="Buka Navigasi"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Konteks Header Kiri: Institusional untuk Admin vs Kelas untuk Dosen/Mahasiswa -->
        <div v-if="authStore.isAdmin" class="flex items-center gap-2.5 min-w-0">
          <span
            class="hidden sm:inline-flex px-2 py-0.5 rounded-sm bg-[#1E3A8A] text-white font-mono text-[10px] font-bold tracking-wider shrink-0"
          >
            ITW
          </span>
          <div class="min-w-0">
            <p class="truncate text-xs font-bold text-[#0F172A] font-jakarta">
              Pusat Kendali Akademik ITW &bull; {{ academicStore.activeTerm ? `${academicStore.activeTerm.name} (${academicStore.activeTerm.code})` : 'Tahun Akademik 2026/2027 (20261)' }}
            </p>
            <p class="truncate text-[10px] text-slate-500 font-mono">
              Dashboard Analitik Institusional
            </p>
          </div>
        </div>

        <div v-else class="flex items-center gap-2.5 min-w-0">
          <span
            v-if="currentClass?.courseCode"
            class="hidden sm:inline-flex px-2 py-0.5 rounded-sm bg-[#1E3A8A] text-white font-mono text-[10px] font-bold tracking-wider shrink-0"
          >
            {{ currentClass.courseCode }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-xs font-bold text-[#0F172A] font-jakarta">
              {{ currentClass?.courseName || 'Pilih Kelas Perkuliahan' }}
            </p>
            <p class="truncate text-[10px] text-slate-500 font-mono">
              {{ academicStore.activeTerm?.code || '—' }}
              <span v-if="currentClass?.code"> · Kelas {{ currentClass.code }}</span>
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span
          v-if="activeNavItem"
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 rounded-sm"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
          <span>{{ activeNavItem.label }}</span>
        </span>

        <!-- Kendali Panel Kanan (Hanya tampil di tab 'sessions' untuk Dosen & Mahasiswa) -->
        <template v-if="shouldShowContextualPanel">
          <!-- Desktop Toggle -->
          <button
            type="button"
            @click="togglePanelCollapsed"
            class="hidden lg:flex p-1.5 rounded-sm border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#1E3A8A] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            :title="isPanelCollapsed ? 'Tampilkan Panel Kontekstual' : 'Sembunyikan Panel Kontekstual'"
          >
            <svg v-if="!isPanelCollapsed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Mobile Toggle -->
          <button
            type="button"
            @click="isMobilePanelOpen = true"
            class="lg:hidden p-1.5 rounded-sm border border-slate-200 text-slate-500 hover:bg-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            title="Buka Presensi & Tenggat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </template>
      </div>
    </header>

    <!-- 2/3-ZONE ACADEMIC WORKSPACE CONTAINER -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- ZONA 1 (KIRI): SIDEBAR NAVIGASI -->
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-40 lg:hidden"
        @click="isMobileSidebarOpen = false"
      ></div>

      <div
        class="fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-in-out lg:translate-x-0"
        :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <SidebarNav
          :sections="sections"
          :active-section="activeSection"
          @update:active-section="(section) => { activeSection = section; isMobileSidebarOpen = false; }"
        />
      </div>

      <!-- ZONA 2 (TENGAH): RUANG KERJA UTAMA DENGAN ARCHITECTURAL GRID TEXTURE -->
      <main class="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-hidden relative">
        <!-- Subtle Architectural Grid Pattern -->
        <div
          class="absolute inset-0 pointer-events-none z-0"
          style="
            background-image:
              linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
            background-size: 24px 24px;
          "
        ></div>

        <!-- Scrollable Slot Container -->
        <div class="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
          <slot :section="activeSection"></slot>
        </div>
      </main>

      <!-- ZONA 3 (KANAN): PANEL KONTEKSTUAL PRESENSI (Hanya saat tab 'sessions' untuk Dosen & Mahasiswa) -->
      <template v-if="shouldShowContextualPanel">
        <div
          v-if="isMobilePanelOpen"
          class="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-40 lg:hidden"
          @click="isMobilePanelOpen = false"
        ></div>

        <div
          v-if="!isPanelCollapsed"
          class="fixed inset-y-0 right-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-in-out lg:translate-x-0"
          :class="isMobilePanelOpen ? 'translate-x-0' : 'translate-x-full'"
        >
          <ContextualPanel />
        </div>
      </template>
    </div>

    <!-- Modal Ujian Daring Mahasiswa -->
    <OnlineExamModal />
  </div>
</template>
