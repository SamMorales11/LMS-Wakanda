<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAssignmentStore } from '~/stores/useAssignmentStore'
import { useQuizStore } from '~/stores/useQuizStore'
import { useAttendanceStore } from '~/stores/useAttendanceStore'
import type { SessionMaterialDto, AssignmentDto, SubmissionDto, ApiResponse } from '~/types'
import EwsAlertBanner from './EwsAlertBanner.vue'
import ContextualPanel from './ContextualPanel.vue'
import PdfViewerModal from './PdfViewerModal.vue'
import SubmitAssignmentModal from './SubmitAssignmentModal.vue'

const academicStore = useAcademicStore()
const authStore = useAuthStore()
const assignmentStore = useAssignmentStore()
const quizStore = useQuizStore()
const attendanceStore = useAttendanceStore()

const currentClass = computed(() => academicStore.selectedClassDetail || academicStore.selectedClass)
const sessions = computed(() => academicStore.sessions)
const selectedSession = computed(() => academicStore.selectedSession)
const selectedSessionNum = computed(() => academicStore.selectedSessionNumber)

// State Materi Perkuliahan
const materials = ref<SessionMaterialDto[]>([])
const isLoadingMaterials = ref(false)

// State Modal PDF In-App Previewer
const isPdfModalOpen = ref(false)
const previewPdfTitle = ref('')
const previewPdfUrl = ref('')

// State Modal Submit Tugas
const isSubmitModalOpen = ref(false)
const selectedAssignmentForSubmit = ref<AssignmentDto | null>(null)

// Format Waktu & Hari Bebas Detik :00
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

const formatSessionDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Fetch Materi Sesi
const fetchMaterials = async (sessionId?: string) => {
  if (!sessionId) {
    materials.value = []
    return
  }
  isLoadingMaterials.value = true
  try {
    const res = await $fetch<ApiResponse<SessionMaterialDto[]>>(`/api/sessions/${sessionId}/materials`)
    if (res.success && res.data) {
      materials.value = res.data
    } else {
      materials.value = []
    }
  } catch (err) {
    console.warn('[StudentSessionWorkspace] Gagal memuat materi sesi:', err)
    materials.value = []
  } finally {
    isLoadingMaterials.value = false
  }
}

const fetchAssignments = async (sessionId?: string) => {
  if (sessionId) {
    await assignmentStore.fetchSessionAssignments(sessionId)
  }
}

const fetchQuizzes = async (sessionId?: string) => {
  if (sessionId) {
    await quizStore.fetchSessionQuizzes(sessionId)
  }
}

// Watchers
watch(
  () => selectedSession.value?.id,
  (newSessionId) => {
    if (newSessionId) {
      fetchMaterials(newSessionId)
      fetchAssignments(newSessionId)
      fetchQuizzes(newSessionId)
    }
  },
  { immediate: true }
)

watch(
  () => academicStore.selectedClassId,
  async (newClassId) => {
    if (newClassId) {
      await attendanceStore.fetchStudentSummary(newClassId)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (academicStore.selectedClassId) {
    await attendanceStore.fetchStudentSummary(academicStore.selectedClassId)
  }
  if (selectedSession.value?.id) {
    await Promise.all([
      fetchMaterials(selectedSession.value.id),
      fetchAssignments(selectedSession.value.id),
      fetchQuizzes(selectedSession.value.id)
    ])
  }
})

// Progres Membaca Materi Mahasiswa
const completedMaterialsCount = computed(() => materials.value.filter(m => m.isCompleted).length)
const materialsProgressPercentage = computed(() => {
  if (materials.value.length === 0) return 0
  return Math.round((completedMaterialsCount.value / materials.value.length) * 100)
})

// Toggle Status Bacaan
const handleToggleReadStatus = async (m: SessionMaterialDto) => {
  const newStatus = !m.isCompleted
  m.isCompleted = newStatus
  m.completedAt = newStatus ? new Date().toISOString() : null

  try {
    await $fetch(`/api/materials/${m.id}/read-status`, {
      method: 'POST',
      body: { isCompleted: newStatus }
    })
  } catch (err) {
    console.error('[StudentSessionWorkspace] Gagal memperbarui status bacaan:', err)
    m.isCompleted = !newStatus
  }
}

const handleOpenPdfPreview = (m: SessionMaterialDto) => {
  previewPdfTitle.value = m.title
  previewPdfUrl.value = m.fileUrl || ''
  isPdfModalOpen.value = true
}

const handleOpenSubmitModal = (a: AssignmentDto) => {
  selectedAssignmentForSubmit.value = a
  isSubmitModalOpen.value = true
}

const handleAssignmentSubmitted = async () => {
  if (selectedSession.value?.id) {
    await assignmentStore.fetchSessionAssignments(selectedSession.value.id)
  }
}

const handleStartExam = async (quizId: string) => {
  try {
    await quizStore.initiateExam(quizId)
  } catch (err: any) {
    alert(err.message || 'Gagal memulai ujian')
  }
}

// Log Kehadiran per Sesi untuk Timeline
const getAttendanceBadgeInfo = (sessionId: string) => {
  const log = attendanceStore.studentSummary?.sessionLogs?.find(l => l.sessionId === sessionId)
  if (!log) {
    return {
      text: 'Belum Hadir',
      bgClass: 'bg-slate-100 text-slate-500 border-slate-200'
    }
  }

  switch (log.status) {
    case 'PRESENT':
      return { text: 'Hadir', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' }
    case 'LATE':
      return { text: 'Terlambat', bgClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold' }
    case 'SICK':
      return { text: 'Sakit', bgClass: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'PERMIT':
      return { text: 'Izin', bgClass: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'ABSENT':
      return { text: 'Alpa', bgClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' }
    default:
      return { text: 'Belum Hadir', bgClass: 'bg-slate-100 text-slate-500 border-slate-200' }
  }
}
</script>

<template>
  <div class="flex-1 flex overflow-hidden h-full">
    <!-- State Loading Detail Kelas -->
    <div
      v-if="academicStore.isDetailLoading"
      class="flex-1 flex items-center justify-center p-12 bg-white"
    >
      <div class="text-center space-y-3">
        <div class="w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-500 font-inter">Memuat struktur 16 pertemuan kelas...</p>
      </div>
    </div>

    <!-- State Kosong Belum Memilih Kelas -->
    <div
      v-else-if="!currentClass"
      class="flex-1 flex items-center justify-center p-12 bg-white"
    >
      <div class="text-center space-y-3 max-w-sm">
        <div class="w-12 h-12 rounded-sm bg-slate-50 border border-slate-200 text-[#0D9488] flex items-center justify-center mx-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-[#0F172A] font-jakarta">Pilih Kelas Perkuliahan</h3>
        <p class="text-xs text-slate-500 font-inter">
          Silakan pilih kelas perkuliahan Anda melalui dropdown di atas untuk memulai sesi belajar.
        </p>
      </div>
    </div>

    <!-- 3-KOLOM LEARNING LAYOUT -->
    <div v-else class="flex-1 flex overflow-hidden w-full">
      <!-- =================================================================== -->
      <!-- KOLOM 1 (KIRI, ~w-72): VERTICAL SYLLABUS TIMELINE P-1 s/d P-16      -->
      <!-- =================================================================== -->
      <aside class="w-64 sm:w-72 border-r border-slate-200/90 bg-white flex flex-col h-full shrink-0 shadow-none overflow-hidden">
        <!-- Header Silabus -->
        <div class="p-3.5 border-b border-slate-200/90 bg-slate-50/70 shrink-0 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700">
              Silabus 16 Pertemuan
            </span>
            <span class="px-1.5 py-0.5 rounded-xs bg-[#1E3A8A] text-white font-mono text-[9px] font-bold">
              P-{{ selectedSessionNum }} Aktif
            </span>
          </div>
          <div class="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-xs bg-amber-400"></span> UTS (P-8)
            </span>
            <span>&bull;</span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-xs bg-blue-500"></span> UAS (P-16)
            </span>
          </div>
        </div>

        <!-- Scrollable Vertical Timeline Stepper -->
        <div class="flex-1 overflow-y-auto p-2.5 space-y-1">
          <button
            v-for="s in sessions"
            :key="s.id"
            type="button"
            @click="academicStore.selectSession(s.sessionNumber)"
            class="w-full text-left p-2.5 rounded-sm border transition flex flex-col gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            :class="selectedSessionNum === s.sessionNumber
              ? 'bg-blue-50/70 border-[#1E3A8A] shadow-2xs'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'"
          >
            <div class="flex items-center justify-between gap-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <span
                  class="font-mono text-xs font-bold px-1.5 py-0.5 rounded-xs shrink-0"
                  :class="selectedSessionNum === s.sessionNumber
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'"
                >
                  P-{{ s.sessionNumber }}
                </span>
                <span
                  v-if="s.sessionType === 'MIDTERM_EXAM'"
                  class="text-[9px] font-mono font-bold px-1 py-0.2 rounded-xs bg-amber-100 text-amber-800 border border-amber-300 shrink-0"
                >
                  UTS
                </span>
                <span
                  v-else-if="s.sessionType === 'FINAL_EXAM'"
                  class="text-[9px] font-mono font-bold px-1 py-0.2 rounded-xs bg-blue-100 text-[#1E3A8A] border border-blue-300 shrink-0"
                >
                  UAS
                </span>
              </div>

              <!-- Status Kehadiran Mahasiswa -->
              <span
                class="text-[9px] font-mono px-1.5 py-0.5 rounded-xs border shrink-0"
                :class="getAttendanceBadgeInfo(s.id).bgClass"
              >
                {{ getAttendanceBadgeInfo(s.id).text }}
              </span>
            </div>

            <!-- Judul Sesi -->
            <p
              class="text-xs font-inter line-clamp-1 leading-snug"
              :class="selectedSessionNum === s.sessionNumber
                ? 'font-bold text-[#1E3A8A]'
                : 'text-slate-700 group-hover:text-slate-900'"
            >
              {{ s.title }}
            </p>
          </button>
        </div>
      </aside>

      <!-- =================================================================== -->
      <!-- KOLOM 2 (TENGAH, flex-1): MATERI BACAAN, PROGRES BACA, TUGAS & KUIS  -->
      <!-- =================================================================== -->
      <main class="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5 bg-[#F8FAFC]">
        <!-- 1. Banner EWS jika ada catatan presensi/tugas -->
        <EwsAlertBanner />

        <!-- 2. Header Sesi Aktif -->
        <section v-if="selectedSession" class="bg-white rounded-sm p-5 border border-slate-200 border-t-2 border-t-[#0D9488] space-y-3.5 shadow-none">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase"
                :class="{
                  'bg-amber-100 text-amber-800 border border-amber-300': selectedSession.sessionType === 'MIDTERM_EXAM',
                  'bg-blue-100 text-[#1E3A8A] border border-blue-300': selectedSession.sessionType === 'FINAL_EXAM',
                  'bg-teal-50 text-[#0D9488] border border-teal-200': selectedSession.sessionType === 'REGULAR'
                }"
              >
                {{ selectedSession.sessionType === 'MIDTERM_EXAM' ? 'Ujian Tengah Semester (UTS)' : (selectedSession.sessionType === 'FINAL_EXAM' ? 'Ujian Akhir Semester (UAS)' : 'Sesi Perkuliahan Tatap Muka') }}
              </span>
              <span class="text-xs text-slate-400 font-mono">
                Pertemuan Ke-{{ selectedSession.sessionNumber }} dari 16
              </span>
            </div>

            <div class="text-xs font-mono text-slate-500 flex items-center gap-2">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ formatSessionDate(selectedSession.sessionDate) }}</span>
            </div>
          </div>

          <!-- Judul Sesi -->
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-[#0F172A] font-jakarta leading-snug">
              {{ selectedSession.title }}
            </h2>
            <p v-if="selectedSession.topicDescription" class="text-xs sm:text-sm text-slate-600 font-inter mt-1.5 leading-relaxed">
              {{ selectedSession.topicDescription }}
            </p>
          </div>

          <!-- Meta Informasi Ruang & Jam Bebas Detik :00 -->
          <div class="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-inter">
            <span class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>{{ currentClass.room || 'Ruang Belum Ditentukan' }}</span>
            </span>

            <span>&bull;</span>

            <span class="flex items-center gap-1.5 font-mono">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ formatScheduleDay(currentClass.scheduleDay) }}, {{ formatTimeNoSeconds(currentClass.scheduleStart, '08:00') }} - {{ formatTimeNoSeconds(currentClass.scheduleEnd, '11:30') }} WIB</span>
            </span>

            <span>&bull;</span>

            <span class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Dosen: {{ currentClass.lecturerName || 'Prof. Shuri, Ph.D.' }}</span>
            </span>
          </div>
        </section>

        <!-- 3. Materi & Bahan Bacaan Perkuliahan -->
        <section class="bg-white rounded-sm p-5 border border-slate-200 space-y-4 shadow-none">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-4 rounded-full bg-[#0D9488]"></span>
              <h3 class="text-sm font-bold text-[#0F172A] font-jakarta">
                Materi & Bahan Bacaan Sesi
              </h3>
            </div>

            <!-- Progres Bacaan Sesi Ini -->
            <div v-if="materials.length > 0" class="flex items-center gap-3">
              <div class="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  class="bg-[#0D9488] h-full transition-all duration-300"
                  :style="{ width: `${materialsProgressPercentage}%` }"
                ></div>
              </div>
              <span class="text-xs font-mono font-bold text-[#0D9488]">
                {{ completedMaterialsCount }}/{{ materials.length }} ({{ materialsProgressPercentage }}%)
              </span>
            </div>
          </div>

          <!-- Empty State Materi -->
          <div
            v-if="materials.length === 0"
            class="p-6 rounded-sm border border-dashed border-slate-300 text-center space-y-1.5 bg-slate-50/50"
          >
            <p class="text-xs font-bold text-slate-700 font-jakarta">Belum Ada Materi Diunggah</p>
            <p class="text-[11px] text-slate-500 font-inter">
              Dosen pengampu belum mengunggah dokumen bacaan pada pertemuan ini.
            </p>
          </div>

          <!-- List Materi Bacaan -->
          <div v-else class="space-y-3">
            <div
              v-for="m in materials"
              :key="m.id"
              class="p-4 rounded-sm border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              :class="m.isCompleted ? 'bg-teal-50/30 border-teal-200' : 'bg-white border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-start gap-3 min-w-0">
                <div
                  class="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
                  :class="m.isCompleted ? 'bg-teal-100 text-[#0D9488]' : 'bg-slate-100 text-slate-500'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <h4 class="text-xs sm:text-sm font-bold text-[#0F172A] font-jakarta truncate">
                    {{ m.title }}
                  </h4>
                  <p v-if="m.description" class="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {{ m.description }}
                  </p>
                  <div class="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                    <span>PDF</span>
                    <span>&bull;</span>
                    <span>{{ formatFileSize(m.fileSize) }}</span>
                    <template v-if="m.isCompleted">
                      <span>&bull;</span>
                      <span class="text-teal-700 font-bold">Selesai Dibaca</span>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Tombol Aksi Materi -->
              <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <!-- Toggle Selesai Dibaca -->
                <button
                  type="button"
                  @click="handleToggleReadStatus(m)"
                  class="px-2.5 py-1.5 rounded-sm text-xs font-jakarta font-semibold border transition flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                  :class="m.isCompleted
                    ? 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-200'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ m.isCompleted ? 'Selesai' : 'Tandai Dibaca' }}</span>
                </button>

                <!-- Pratinjau Dokumen In-App -->
                <button
                  type="button"
                  @click="handleOpenPdfPreview(m)"
                  class="px-2.5 py-1.5 rounded-sm bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold font-jakarta transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                >
                  Pratinjau
                </button>

                <!-- Unduh File -->
                <a
                  v-if="m.fileUrl"
                  :href="m.fileUrl"
                  target="_blank"
                  download
                  class="p-1.5 rounded-sm border border-slate-300 text-slate-600 hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                  title="Unduh Berkas"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. Tugas Perkuliahan Sesi Ini -->
        <section class="bg-white rounded-sm p-5 border border-slate-200 space-y-4 shadow-none">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-4 rounded-full bg-[#1E3A8A]"></span>
              <h3 class="text-sm font-bold text-[#0F172A] font-jakarta">
                Tugas & Evaluasi Mandiri
              </h3>
            </div>
            <span class="text-xs font-mono text-slate-500">
              {{ assignmentStore.assignments.length }} Tugas Terdaftar
            </span>
          </div>

          <!-- Empty State Tugas -->
          <div
            v-if="assignmentStore.assignments.length === 0"
            class="p-6 rounded-sm border border-dashed border-slate-300 text-center space-y-1.5 bg-slate-50/50"
          >
            <p class="text-xs font-bold text-slate-700 font-jakarta">Tidak Ada Tugas pada Sesi Ini</p>
            <p class="text-[11px] text-slate-500 font-inter">
              Silakan fokus pada materi bacaan dan persiapan evaluasi berkala.
            </p>
          </div>

          <!-- List Tugas -->
          <div v-else class="space-y-3">
            <div
              v-for="a in assignmentStore.assignments"
              :key="a.id"
              class="p-4 rounded-sm border border-slate-200 bg-white space-y-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="text-xs sm:text-sm font-bold text-[#0F172A] font-jakarta">
                  {{ a.title }}
                </h4>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200 text-slate-700">
                  Maks: {{ a.maxScore }} Poin
                </span>
              </div>

              <p v-if="a.description" class="text-xs text-slate-600 font-inter">
                {{ a.description }}
              </p>

              <!-- Meta Deadline -->
              <div class="p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <span class="text-slate-600">
                  Tenggat: <strong class="text-[#0F172A]">{{ new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }} WIB</strong>
                </span>
                <span class="text-slate-400 text-[10px]">
                  Format: {{ a.allowedFileTypes.toUpperCase() }} (Maks {{ a.maxFileSizeMb }} MB)
                </span>
              </div>

              <!-- Status Pengumpulan Mahasiswa -->
              <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div v-if="a.mySubmission" class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold text-white uppercase"
                    :style="{ backgroundColor: a.mySubmission.timingColor }"
                  >
                    ● {{ a.mySubmission.timingLabel }}
                  </span>
                  <span v-if="a.mySubmission.status === 'GRADED'" class="text-xs font-mono font-bold text-[#0D9488]">
                    Nilai: {{ a.mySubmission.score }} / {{ a.maxScore }}
                  </span>
                  <span v-else class="text-xs text-slate-500 font-inter">
                    Menunggu Penilaian Dosen
                  </span>
                </div>
                <div v-else class="text-xs text-rose-600 font-inter">
                  Belum Mengumpulkan Tugas
                </div>

                <!-- Tombol Kumpulkan -->
                <button
                  type="button"
                  @click="handleOpenSubmitModal(a)"
                  class="px-3.5 py-1.5 rounded-sm bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold font-jakarta transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                >
                  {{ a.mySubmission ? 'Unggah Ulang Berkas' : 'Kumpulkan Tugas' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. Ujian & Kuis Sesi (Online Exam) -->
        <section class="bg-white rounded-sm p-5 border border-slate-200 space-y-4 shadow-none">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-4 rounded-full bg-[#1E3A8A]"></span>
              <h3 class="text-sm font-bold text-[#0F172A] font-jakarta">
                Evaluasi Daring (Kuis / UTS / UAS)
              </h3>
            </div>
            <span class="text-xs font-mono text-slate-500">
              {{ quizStore.sessionQuizzes.length }} Ujian Terdaftar
            </span>
          </div>

          <!-- Empty State Ujian -->
          <div
            v-if="quizStore.sessionQuizzes.length === 0"
            class="p-6 rounded-sm border border-dashed border-slate-300 text-center space-y-1.5 bg-slate-50/50"
          >
            <p class="text-xs font-bold text-slate-700 font-jakarta">Tidak Ada Ujian pada Sesi Ini</p>
            <p class="text-[11px] text-slate-500 font-inter">
              Evaluasi kuis mingguan dan ujian tengah/akhir semester akan tampil otomatis sesuai kalender perkuliahan.
            </p>
          </div>

          <!-- List Kuis -->
          <div v-else class="space-y-3">
            <div
              v-for="q in quizStore.sessionQuizzes"
              :key="q.id"
              class="p-4 rounded-sm border border-slate-200 bg-white space-y-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200 text-slate-700 mr-2">
                    {{ q.quizType }}
                  </span>
                  <h4 class="inline text-xs sm:text-sm font-bold text-[#0F172A] font-jakarta">
                    {{ q.title }}
                  </h4>
                </div>
                <span
                  class="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm"
                  :class="q.accessStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'"
                >
                  {{ q.accessStatus === 'ACTIVE' ? 'Sedang Berlangsung' : 'Ditutup / Belum Dibuka' }}
                </span>
              </div>

              <p v-if="q.description" class="text-xs text-slate-600 font-inter">
                {{ q.description }}
              </p>

              <div class="p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <span>Durasi: <strong>{{ q.durationMinutes }} Menit</strong> ({{ q.questionsCount }} Soal)</span>
                <span>Maks: <strong>{{ q.maxScore }} Poin</strong> (KKM: {{ q.passingScore }})</span>
              </div>

              <!-- Hasil Mahasiswa jika sudah mencoba -->
              <div v-if="q.myLatestAttempt" class="p-2.5 rounded-sm bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono">
                <span class="text-emerald-800 font-jakarta font-bold">Hasil Ujian Anda:</span>
                <span class="text-emerald-900 font-bold">
                  Nilai: {{ q.myLatestAttempt.score || q.myLatestAttempt.autoScore || '0.00' }} / {{ q.maxScore }} ({{ q.myLatestAttempt.status }})
                </span>
              </div>

              <!-- Tombol Mulai Ujian -->
              <div class="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  @click="handleStartExam(q.id)"
                  :disabled="q.accessStatus !== 'ACTIVE'"
                  class="px-4 py-2 rounded-sm text-white text-xs font-bold font-jakarta transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:opacity-40"
                  :class="q.accessStatus === 'ACTIVE' ? 'bg-[#1E3A8A] hover:bg-blue-900' : 'bg-slate-300 text-slate-500'"
                >
                  {{ q.myLatestAttempt && q.myLatestAttempt.status === 'IN_PROGRESS' ? 'Lanjutkan Ujian Daring' : 'Mulai Kerjakan Ujian Daring' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- =================================================================== -->
      <!-- KOLOM 3 (KANAN, ~w-80): WIDGET CHECK-IN PIN PRESENSI & TENGGAT TERDEKAT-->
      <!-- =================================================================== -->
      <ContextualPanel class="w-72 sm:w-80 border-l border-slate-200/90" />
    </div>

    <!-- Modals -->
    <PdfViewerModal
      :is-open="isPdfModalOpen"
      :title="previewPdfTitle"
      :pdf-url="previewPdfUrl"
      @close="isPdfModalOpen = false"
    />

    <SubmitAssignmentModal
      :is-open="isSubmitModalOpen"
      :assignment="selectedAssignmentForSubmit"
      @close="isSubmitModalOpen = false"
      @submitted="handleAssignmentSubmitted"
    />
  </div>
</template>
