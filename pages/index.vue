<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAttendanceStore } from '~/stores/useAttendanceStore'
import SidebarNav from '~/components/workspace/SidebarNav.vue'
import SessionWorkspace from '~/components/workspace/SessionWorkspace.vue'
import AttendanceRecapView from '~/components/workspace/AttendanceRecapView.vue'
import AssignmentRecapView from '~/components/workspace/AssignmentRecapView.vue'
import GradeWeightsView from '~/components/workspace/GradeWeightsView.vue'
import GradebookView from '~/components/workspace/GradebookView.vue'
import StudentGradesView from '~/components/workspace/StudentGradesView.vue'
import EwsDashboardView from '~/components/workspace/EwsDashboardView.vue'
import ArchitectureInspector from '~/components/workspace/ArchitectureInspector.vue'
import ContextualPanel from '~/components/workspace/ContextualPanel.vue'
import OnlineExamModal from '~/components/workspace/OnlineExamModal.vue'

const authStore = useAuthStore()
const academicStore = useAcademicStore()
const attendanceStore = useAttendanceStore()

// State Navigasi Tab Utama di Zona Tengah
const activeMainTab = ref<'workspace' | 'recap-attendance' | 'recap-assignments' | 'grades' | 'ews' | 'architecture'>('workspace')

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
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition focus:outline-none text-xs font-semibold font-jakarta flex items-center gap-1.5"
          title="Buka Presensi & Tenggat"
        >
          <span v-if="attendanceStore.hasActiveToken" class="w-2 h-2 rounded-full bg-semantic-success animate-pulse"></span>
          <span>Presensi</span>
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
      <main class="flex-1 flex flex-col min-w-0 bg-slate-50/60 overflow-hidden relative">
        <!-- Sub-Header Tab Switcher di Atas Workspace (Scrollable on Mobile) -->
        <div class="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
          <div class="flex items-center space-x-3 sm:space-x-6 text-xs font-semibold font-inter shrink-0">
            <button
              type="button"
              @click="activeMainTab = 'workspace'"
              class="h-14 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap"
              :class="activeMainTab === 'workspace' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>📚 16 Pertemuan</span>
            </button>

            <button
              type="button"
              @click="activeMainTab = 'recap-attendance'"
              class="h-14 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap"
              :class="activeMainTab === 'recap-attendance' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>📊 Rekap Presensi</span>
            </button>

            <button
              type="button"
              @click="activeMainTab = 'recap-assignments'"
              class="h-14 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap"
              :class="activeMainTab === 'recap-assignments' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>📝 Rekap Tugas</span>
            </button>

            <button
              type="button"
              @click="activeMainTab = 'grades'"
              class="h-14 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap"
              :class="activeMainTab === 'grades' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span v-if="authStore.isLecturer || authStore.isAdmin">⚖️ Gradebook & Penilaian</span>
              <span v-else>📈 Transparansi Nilai & Simulasi UAS</span>
            </button>

            <!-- Tab EWS & Analitik Kelulusan (Dosen / Admin) -->
            <button
              v-if="authStore.isLecturer || authStore.isAdmin"
              type="button"
              @click="activeMainTab = 'ews'"
              class="h-14 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap"
              :class="activeMainTab === 'ews' ? 'border-semantic-danger text-semantic-danger font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>🚨 EWS &amp; Analitik</span>
            </button>

            <button
              type="button"
              @click="activeMainTab = 'architecture'"
              class="h-14 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap"
              :class="activeMainTab === 'architecture' ? 'border-scholarly-teal text-scholarly-teal font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
            >
              <span>🏛️ Arsitektur &amp; RBAC</span>
            </button>
          </div>

          <!-- Sesi / User Indicator Status -->
          <div class="hidden md:flex items-center space-x-2 text-xs font-inter text-slate-500 shrink-0">
            <span class="w-2 h-2 rounded-full bg-semantic-success"></span>
            <span class="font-mono text-[11px]">DB Neon Connected</span>
          </div>
        </div>

        <!-- Render Zona Tengah Berdasarkan Tab Aktif -->
        <SessionWorkspace v-if="activeMainTab === 'workspace'" />
        <AttendanceRecapView v-else-if="activeMainTab === 'recap-attendance'" />
        <AssignmentRecapView v-else-if="activeMainTab === 'recap-assignments'" />
        <GradebookView v-else-if="activeMainTab === 'grades' && (authStore.isLecturer || authStore.isAdmin)" />
        <StudentGradesView v-else-if="activeMainTab === 'grades'" />
        <EwsDashboardView v-else-if="activeMainTab === 'ews' && (authStore.isLecturer || authStore.isAdmin)" />
        <ArchitectureInspector v-else-if="activeMainTab === 'architecture'" />

        <!-- Floating Mobile Quick Action for Attendance on Phones -->
        <div class="lg:hidden fixed bottom-4 right-4 z-30">
          <button
            type="button"
            @click="isMobilePanelOpen = true"
            class="py-3 px-4 rounded-2xl bg-academic-navy hover:bg-blue-900 text-white font-bold text-xs shadow-xl flex items-center gap-2 border border-white/20 font-jakarta"
          >
            <span v-if="attendanceStore.hasActiveToken" class="w-2.5 h-2.5 rounded-full bg-semantic-success animate-ping"></span>
            <span>🔑 Presensi & Tenggat</span>
          </button>
        </div>
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

    <!-- Modal Ujian Daring Mahasiswa (Global Real-time Timer & Navigasi) -->
    <OnlineExamModal />
  </div>
</template>
