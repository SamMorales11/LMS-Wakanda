<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import SidebarNav from '~/components/workspace/SidebarNav.vue'
import SessionWorkspace from '~/components/workspace/SessionWorkspace.vue'
import GradeWeightsView from '~/components/workspace/GradeWeightsView.vue'
import ArchitectureInspector from '~/components/workspace/ArchitectureInspector.vue'
import ContextualPanel from '~/components/workspace/ContextualPanel.vue'

const authStore = useAuthStore()
const academicStore = useAcademicStore()

// State Navigasi Tab Utama di Zona Tengah
const activeMainTab = ref<'workspace' | 'grades' | 'architecture'>('workspace')

// State Mobile Responsive Drawers
const isMobileSidebarOpen = ref(false)
const isMobilePanelOpen = ref(false)

onMounted(async () => {
  await Promise.all([
    authStore.fetchUser(),
    academicStore.initWorkspace()
  ])
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-alabaster-slate text-deep-ink flex flex-col font-sans antialiased">
    <!-- Top Mobile / Compact Navigation Header -->
    <header class="lg:hidden h-14 bg-academic-navy text-white px-4 flex items-center justify-between border-b border-academic-navy/30 shrink-0 z-30">
      <div class="flex items-center space-x-2">
        <button
          type="button"
          @click="isMobileSidebarOpen = !isMobileSidebarOpen"
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
          title="Buka Navigasi Kelas"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="font-bold text-sm font-jakarta tracking-tight">LMS Wakanda</span>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-scholarly-teal text-white">
          {{ academicStore.selectedClass?.code ? `Kelas ${academicStore.selectedClass.code}` : 'Pilih Kelas' }}
        </span>
        <button
          type="button"
          @click="isMobilePanelOpen = !isMobilePanelOpen"
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition focus:outline-none text-xs font-semibold font-jakarta"
          title="Buka Presensi & Tenggat"
        >
          Presensi
        </button>
      </div>
    </header>

    <!-- 3-ZONE ACADEMIC WORKSPACE CONTAINER -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- ============================================== -->
      <!-- ZONA 1 (KIRI): SIDEBAR NAVIGASI AKADEMIK        -->
      <!-- ============================================== -->
      <!-- Mobile Overlay Drawer -->
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 bg-deep-ink/50 backdrop-blur-xs z-40 lg:hidden"
        @click="isMobileSidebarOpen = false"
      ></div>

      <div
        class="fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-in-out lg:translate-x-0"
        :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <SidebarNav
          :active-main-tab="activeMainTab"
          @update:active-main-tab="(tab) => { activeMainTab = tab; isMobileSidebarOpen = false; }"
        />
      </div>

      <!-- ============================================== -->
      <!-- ZONA 2 (TENGAH): WORKSPACE UTAMA 16 PERTEMUAN  -->
      <!-- ============================================== -->
      <main class="flex-1 flex flex-col min-w-0 bg-slate-50/60 overflow-hidden">
        <!-- Sub-Header Tab Switcher di Atas Workspace -->
        <div class="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div class="flex items-center space-x-4 sm:space-x-6 text-xs font-semibold font-inter">
            <button
              type="button"
              @click="activeMainTab = 'workspace'"
              class="h-14 border-b-2 transition flex items-center gap-1.5"
              :class="activeMainTab === 'workspace' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>📚 16 Pertemuan</span>
            </button>

            <button
              type="button"
              @click="activeMainTab = 'grades'"
              class="h-14 border-b-2 transition flex items-center gap-1.5"
              :class="activeMainTab === 'grades' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>⚖️ Bobot Nilai (100%)</span>
            </button>

            <button
              type="button"
              @click="activeMainTab = 'architecture'"
              class="h-14 border-b-2 transition flex items-center gap-1.5"
              :class="activeMainTab === 'architecture' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>🏛️ Arsitektur & RBAC</span>
            </button>
          </div>

          <!-- Sesi / User Indicator Status -->
          <div class="hidden sm:flex items-center space-x-2 text-xs font-inter text-slate-500">
            <span class="w-2 h-2 rounded-full bg-semantic-success"></span>
            <span class="font-mono text-[11px]">DB Neon Connected</span>
          </div>
        </div>

        <!-- Render Zona Tengah Berdasarkan Tab Aktif -->
        <SessionWorkspace v-if="activeMainTab === 'workspace'" />
        <GradeWeightsView v-else-if="activeMainTab === 'grades'" />
        <ArchitectureInspector v-else-if="activeMainTab === 'architecture'" />
      </main>

      <!-- ============================================== -->
      <!-- ZONA 3 (KANAN): PANEL KONTEKSTUAL PRESENSI     -->
      <!-- ============================================== -->
      <!-- Mobile Drawer for Zone 3 -->
      <div
        v-if="isMobilePanelOpen"
        class="fixed inset-0 bg-deep-ink/50 backdrop-blur-xs z-40 lg:hidden"
        @click="isMobilePanelOpen = false"
      ></div>

      <div
        class="fixed inset-y-0 right-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-in-out lg:translate-x-0"
        :class="isMobilePanelOpen ? 'translate-x-0' : 'translate-x-full'"
      >
        <ContextualPanel />
      </div>
    </div>
  </div>
</template>
