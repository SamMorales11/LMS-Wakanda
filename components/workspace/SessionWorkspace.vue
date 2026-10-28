<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAssignmentStore } from '~/stores/useAssignmentStore'
import { useQuizStore } from '~/stores/useQuizStore'
import type { ClassSessionDto, SessionMaterialDto, AssignmentDto, SubmissionDto, QuizDto, ApiResponse } from '~/types'
import PdfViewerModal from './PdfViewerModal.vue'
import AddMaterialModal from './AddMaterialModal.vue'
import AddAssignmentModal from './AddAssignmentModal.vue'
import SubmitAssignmentModal from './SubmitAssignmentModal.vue'
import AssignmentSubmissionsModal from './AssignmentSubmissionsModal.vue'
import GradingSubmissionsModal from './GradingSubmissionsModal.vue'
import GradingQuizAttemptsModal from './GradingQuizAttemptsModal.vue'

const academicStore = useAcademicStore()
const authStore = useAuthStore()
const assignmentStore = useAssignmentStore()
const quizStore = useQuizStore()

const currentClass = computed(() => academicStore.selectedClassDetail || academicStore.selectedClass)
const sessions = computed(() => academicStore.sessions)
const selectedSession = computed(() => academicStore.selectedSession)
const selectedSessionNum = computed(() => academicStore.selectedSessionNumber)

// Dosen Pengampu
const primaryLecturer = computed(() => {
  if (academicStore.selectedClassDetail?.lecturers && academicStore.selectedClassDetail.lecturers.length > 0) {
    return academicStore.selectedClassDetail.lecturers[0]
  }
  return {
    name: "Dr. T'Challa, M.T.",
    nimNidn: '0010048801',
    email: 'tchalla.dosen@itw.ac.id'
  }
})

// State Materi Perkuliahan
const materials = ref<SessionMaterialDto[]>([])
const isLoadingMaterials = ref(false)
const isAddModalOpen = ref(false)

// State Modal In-App PDF Previewer
const isPdfModalOpen = ref(false)
const previewPdfTitle = ref('')
const previewPdfUrl = ref('')

// State Tugas & Pengumpulan (Assignments & Submissions)
const isAddAssignmentOpen = ref(false)
const isSubmitAssignmentOpen = ref(false)
const selectedAssignmentForSubmit = ref<AssignmentDto | null>(null)
const isOverviewModalOpen = ref(false)

// State Ujian & Grading (Fase 3)
const isGradingSubmissionsOpen = ref(false)
const selectedAssignmentIdForGrading = ref<string | null>(null)
const isGradingQuizAttemptsOpen = ref(false)
const selectedQuizIdForGrading = ref<string | null>(null)

// Load Materi & Tugas per Sesi
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
    console.warn('[SessionWorkspace] Gagal memuat materi sesi:', err)
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

// Watch perubahan sesi aktif
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

onMounted(() => {
  if (selectedSession.value?.id) {
    fetchMaterials(selectedSession.value.id)
    fetchAssignments(selectedSession.value.id)
    fetchQuizzes(selectedSession.value.id)
  }
})

// Modal Actions for Assignments & Grading
const handleOpenGradingSubmissions = (assignmentId: string) => {
  selectedAssignmentIdForGrading.value = assignmentId
  isGradingSubmissionsOpen.value = true
}

const handleOpenGradingQuizAttempts = (quizId: string) => {
  selectedQuizIdForGrading.value = quizId
  isGradingQuizAttemptsOpen.value = true
}

const handleStartExam = async (quizId: string) => {
  try {
    await quizStore.initiateExam(quizId)
  } catch (err: any) {
    alert(err.message || 'Gagal memulai ujian')
  }
}

// Modal Actions for Assignments
const handleOpenSubmitModal = (a: AssignmentDto) => {
  selectedAssignmentForSubmit.value = a
  isSubmitAssignmentOpen.value = true
}

const handleOpenOverviewModal = async (a: AssignmentDto) => {
  await assignmentStore.fetchAssignmentOverview(a.id)
  isOverviewModalOpen.value = true
}

const handleDeleteAssignment = async (a: AssignmentDto) => {
  if (!confirm(`Hapus tugas '${a.title}'? Tindakan ini tidak dapat dibatalkan.`)) return
  try {
    await assignmentStore.deleteAssignment(a.id, selectedSession.value?.id)
  } catch (err: any) {
    alert(err.message || 'Gagal menghapus tugas')
  }
}

// Format tanggal sesi perkuliahan
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

// Styling badge per tipe sesi
const getSessionBadgeClass = (session: ClassSessionDto, isSelected: boolean) => {
  if (session.sessionType === 'MIDTERM_EXAM') {
    return isSelected
      ? 'bg-amber-alert text-white ring-2 ring-amber-500 shadow-md'
      : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
  }
  if (session.sessionType === 'FINAL_EXAM') {
    return isSelected
      ? 'bg-academic-navy text-white ring-2 ring-blue-900 shadow-md'
      : 'bg-blue-50 text-academic-navy border border-blue-300 hover:bg-blue-100'
  }
  return isSelected
    ? 'bg-scholarly-teal text-white ring-2 ring-teal-600 shadow-md'
    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
}

// Handler Pratinjau Dokumen PDF In-App
const handleOpenPdfPreview = (m: SessionMaterialDto) => {
  previewPdfTitle.value = m.title
  previewPdfUrl.value = m.fileUrl || ''
  isPdfModalOpen.value = true
}

// Handler Tandai Status Bacaan Mahasiswa
const handleToggleReadStatus = async (m: SessionMaterialDto) => {
  const newStatus = !m.isCompleted
  // Update optimistik di UI
  m.isCompleted = newStatus
  m.completedAt = newStatus ? new Date().toISOString() : null

  try {
    await $fetch(`/api/materials/${m.id}/read-status`, {
      method: 'POST',
      body: {
        isCompleted: newStatus
      }
    })
  } catch (err) {
    console.error('[SessionWorkspace] Gagal memperbarui status bacaan:', err)
    // Revert jika gagal
    m.isCompleted = !newStatus
  }
}

// Handler Hapus Materi (Dosen / Admin)
const handleDeleteMaterial = async (m: SessionMaterialDto) => {
  if (!confirm(`Hapus materi '${m.title}' dari sesi ini?`)) return

  try {
    await $fetch(`/api/materials/${m.id}`, {
      method: 'DELETE'
    })
    if (selectedSession.value?.id) {
      await fetchMaterials(selectedSession.value.id)
    }
  } catch (err) {
    console.error('[SessionWorkspace] Gagal menghapus materi:', err)
    alert('Gagal menghapus materi.')
  }
}

// Ringkasan Progres Belajar Mahasiswa di Sesi ini
const completedMaterialsCount = computed(() => materials.value.filter((m) => m.isCompleted).length)
const materialsProgressPercentage = computed(() => {
  if (materials.value.length === 0) return 0
  return Math.round((completedMaterialsCount.value / materials.value.length) * 100)
})

// Format ukuran file
const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- State Loading Kelas -->
    <div v-if="academicStore.isDetailLoading" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
      <div class="w-8 h-8 border-3 border-scholarly-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-slate-500 font-inter">Memuat detail struktur 16 pertemuan kelas...</p>
    </div>

    <!-- State Kosong / Belum ada kelas dipilih -->
    <div v-else-if="!currentClass" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-teal-50 text-scholarly-teal flex items-center justify-center mx-auto text-2xl font-bold">
        📚
      </div>
      <h3 class="text-lg font-bold text-academic-navy font-jakarta">Pilih Kelas Perkuliahan</h3>
      <p class="text-xs text-slate-500 font-inter max-w-md mx-auto">
        Silakan pilih salah satu kelas paralel dari daftar sidebar di sebelah kiri untuk melihat struktur 16 pertemuan perkuliahan.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Header Banner Kelas Aktif -->
      <section class="bg-gradient-to-r from-academic-navy via-blue-900 to-academic-navy rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-scholarly-teal/20 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 font-mono text-xs font-semibold">
                {{ currentClass.courseCode || 'KODE MK' }}
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-xs font-bold">
                Kelas {{ currentClass.code }} (Rombel)
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-xs">
                Kapasitas: {{ currentClass.capacity || 40 }} Mahasiswa
              </span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-jakarta">
              {{ currentClass.courseName || currentClass.code }}
            </h2>

            <div class="flex flex-wrap items-center gap-4 text-xs text-slate-200 font-inter pt-1">
              <div class="flex items-center gap-1.5">
                <span class="text-teal-300">👤</span>
                <span>Dosen: <strong class="text-white">{{ primaryLecturer.name }}</strong> (NIDN: {{ primaryLecturer.nimNidn || '-' }})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-teal-300">📍</span>
                <span>{{ currentClass.room || 'Lab Komputasi' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-teal-300">🗓️</span>
                <span>{{ currentClass.scheduleDay || 'Senin' }}, {{ currentClass.scheduleStart || '08:00' }} - {{ currentClass.scheduleEnd || '10:30' }} WIB</span>
              </div>
            </div>
          </div>

          <!-- Quick Class Metric -->
          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 text-center min-w-[140px]">
            <span class="text-[11px] text-slate-300 font-inter block">Total Kurikulum</span>
            <span class="text-2xl font-black font-mono text-white mt-0.5 block">16 Pertemuan</span>
            <span class="text-[10px] text-teal-300 font-inter block mt-1">UTS (Sesi 8) • UAS (Sesi 16)</span>
          </div>
        </div>
      </section>

      <!-- Navigator Tab 16 Pertemuan Perkuliahan -->
      <section class="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="text-base font-bold text-academic-navy font-jakarta">
              Struktur Sesi Kurikulum (16 Pertemuan)
            </h3>
            <p class="text-xs text-slate-500 font-inter">
              Pilih pertemuan di bawah ini untuk melihat silabus, materi ajar, dan status kehadiran:
            </p>
          </div>

          <!-- Legend -->
          <div class="flex items-center gap-3 text-[11px] font-inter">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-scholarly-teal"></span>
              <span class="text-slate-600">Tatap Muka (1-7 & 9-15)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-amber-alert"></span>
              <span class="text-slate-600 font-medium">Sesi 8 (UTS)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-academic-navy"></span>
              <span class="text-slate-600 font-medium">Sesi 16 (UAS)</span>
            </div>
          </div>
        </div>

        <!-- 16 Pertemuan Grid / Ribbon Selector -->
        <div class="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-1.5 sm:gap-2">
          <button
            v-for="s in sessions"
            :key="s.id"
            type="button"
            @click="academicStore.selectSession(s.sessionNumber)"
            class="flex flex-col items-center justify-center p-2 rounded-xl transition text-center relative group"
            :class="getSessionBadgeClass(s, selectedSessionNum === s.sessionNumber)"
          >
            <span class="text-[10px] uppercase font-mono font-bold leading-none">
              P-{{ s.sessionNumber }}
            </span>
            <span class="text-[9px] font-mono mt-1 opacity-90 truncate max-w-full">
              {{ s.sessionType === 'MIDTERM_EXAM' ? 'UTS' : (s.sessionType === 'FINAL_EXAM' ? 'UAS' : 'KULIAH') }}
            </span>
          </button>
        </div>
      </section>

      <!-- Detail Pertemuan Terpilih (Active Session View) -->
      <section v-if="selectedSession" class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
        <!-- Top Session Meta Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase"
                :class="{
                  'bg-amber-100 text-amber-800 border border-amber-300': selectedSession.sessionType === 'MIDTERM_EXAM',
                  'bg-blue-100 text-academic-navy border border-blue-300': selectedSession.sessionType === 'FINAL_EXAM',
                  'bg-teal-50 text-scholarly-teal border border-teal-200': selectedSession.sessionType === 'REGULAR'
                }"
              >
                {{ selectedSession.sessionType === 'MIDTERM_EXAM' ? 'Ujian Tengah Semester (UTS)' : (selectedSession.sessionType === 'FINAL_EXAM' ? 'Ujian Akhir Semester (UAS)' : 'Sesi Perkuliahan Tatap Muka') }}
              </span>
              <span class="text-xs text-slate-400 font-mono">Pertemuan Ke-{{ selectedSession.sessionNumber }} dari 16</span>
            </div>

            <h3 class="text-xl sm:text-2xl font-bold text-academic-navy font-jakarta">
              {{ selectedSession.title }}
            </h3>
          </div>

          <div class="text-left sm:text-right font-inter text-xs space-y-0.5">
            <span class="text-slate-500 block">Jadwal Pelaksanaan</span>
            <span class="font-bold text-slate-800 block font-jakarta">
              {{ formatSessionDate(selectedSession.sessionDate) }}
            </span>
            <span class="font-mono text-scholarly-teal block">
              ⏰ {{ selectedSession.startTime || '08:00' }} - {{ selectedSession.endTime || '10:30' }} WIB
            </span>
          </div>
        </div>

        <!-- Silabus & Topik Perkuliahan -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Topik Bahasan & Rencana Pembelajaran Semester
          </h4>
          <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 text-slate-700 text-sm font-inter leading-relaxed">
            <p v-if="selectedSession.topicDescription">
              {{ selectedSession.topicDescription }}
            </p>
            <p v-else-if="selectedSession.sessionType === 'MIDTERM_EXAM'">
              Evaluasi Ujian Tengah Semester (UTS) mencakup seluruh kompetensi dan capaian pembelajaran materi Pertemuan 1 hingga 7. Mahasiswa wajib hadir tepat waktu dengan token presensi ujian terverifikasi.
            </p>
            <p v-else-if="selectedSession.sessionType === 'FINAL_EXAM'">
              Evaluasi Ujian Akhir Semester (UAS) / Sidang Proyek Akhir mencakup seluruh implementasi arsitektur sistem, kode sumber, dan dokumentasi teknis yang dikembangkan sepanjang semester.
            </p>
            <p v-else>
              Sesi perkuliahan ke-{{ selectedSession.sessionNumber }} berfokus pada pendalaman teori, studi kasus rekayasa perangkat lunak, demonstrasi praktikum lab komputasi, serta latihan mandiri terstruktur.
            </p>
          </div>
        </div>

        <!-- Modul & Materi Ajar Pembelajaran (Distribusi Materi Mingguan) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Distribusi Materi Pembelajaran Sesi {{ selectedSession.sessionNumber }}
                </h4>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-scholarly-teal font-bold border border-teal-200">
                  {{ materials.length }} Materi
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-inter mt-0.5">
                Slide PDF, kode sumber, dan video pembelajaran resmi sesi ini.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <!-- Indikator Progres Belajar Mahasiswa -->
              <div v-if="materials.length > 0" class="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-inter">
                <span class="text-slate-500 text-[11px]">Progres Bacaan:</span>
                <span class="font-mono font-bold" :class="materialsProgressPercentage === 100 ? 'text-semantic-success' : 'text-academic-navy'">
                  {{ completedMaterialsCount }}/{{ materials.length }} ({{ materialsProgressPercentage }}%)
                </span>
              </div>

              <!-- Tombol Tambah Materi untuk Dosen / Admin -->
              <button
                v-if="authStore.isLecturer || authStore.isAdmin"
                type="button"
                @click="isAddModalOpen = true"
                class="px-3.5 py-1.5 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 font-jakarta"
              >
                <span>+ Tambah Materi</span>
              </button>
            </div>
          </div>

          <!-- Loading State Materi -->
          <div v-if="isLoadingMaterials" class="p-6 text-center space-y-2">
            <div class="w-6 h-6 border-2 border-scholarly-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
            <span class="text-xs text-slate-400 font-inter">Memuat materi perkuliahan...</span>
          </div>

          <!-- Empty State Materi -->
          <div v-else-if="materials.length === 0" class="p-8 text-center rounded-2xl bg-alabaster-slate border border-slate-200 space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-xl">
              📂
            </div>
            <div class="space-y-1">
              <h5 class="text-xs font-bold text-academic-navy font-jakarta">Belum Ada Materi Pembelajaran</h5>
              <p class="text-[11px] text-slate-500 font-inter max-w-sm mx-auto">
                {{ authStore.isLecturer || authStore.isAdmin ? 'Klik tombol "+ Tambah Materi" di atas untuk mengunggah slide PDF, kode sumber, atau tautan video.' : 'Dosen pengampu belum mengunggah materi untuk sesi perkuliahan ini.' }}
              </p>
            </div>
          </div>

          <!-- Grid Materi Perkuliahan -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="m in materials"
              :key="m.id"
              class="p-4 rounded-2xl border transition space-y-3 font-inter flex flex-col justify-between"
              :class="m.isCompleted ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200/90 hover:border-scholarly-teal'"
            >
              <div class="space-y-2">
                <!-- Top Badge Row -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="text-base">
                      {{ m.materialType === 'SLIDE' ? '📑' : (m.materialType === 'CODE' ? '💻' : (m.materialType === 'VIDEO' ? '🎥' : '📖')) }}
                    </span>
                    <span
                      class="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
                      :class="{
                        'bg-teal-50 text-scholarly-teal border border-teal-200': m.materialType === 'SLIDE',
                        'bg-blue-50 text-academic-navy border border-blue-200': m.materialType === 'CODE',
                        'bg-amber-50 text-amber-800 border border-amber-200': m.materialType === 'VIDEO',
                        'bg-purple-50 text-purple-800 border border-purple-200': m.materialType === 'DOCUMENT'
                      }"
                    >
                      {{ m.materialType === 'SLIDE' ? 'Slide PDF' : (m.materialType === 'CODE' ? 'Kode Sumber' : (m.materialType === 'VIDEO' ? 'Video' : 'Dokumen')) }}
                    </span>
                  </div>

                  <span v-if="m.fileSize" class="text-[10px] font-mono text-slate-400">
                    {{ formatFileSize(m.fileSize) }}
                  </span>
                </div>

                <!-- Judul & Deskripsi -->
                <div>
                  <h5 class="text-xs font-bold text-academic-navy font-jakarta line-clamp-2 leading-snug">
                    {{ m.title }}
                  </h5>
                  <p v-if="m.description" class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {{ m.description }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons & Read Status -->
              <div class="pt-3 border-t border-slate-100 space-y-2">
                <div class="flex items-center gap-2">
                  <!-- Tombol Pratinjau PDF In-App -->
                  <button
                    v-if="(m.materialType === 'SLIDE' || m.materialType === 'DOCUMENT') && m.fileUrl"
                    type="button"
                    @click="handleOpenPdfPreview(m)"
                    class="flex-1 py-1.5 px-2.5 rounded-xl bg-scholarly-teal/10 hover:bg-scholarly-teal/20 text-scholarly-teal font-bold text-[11px] transition text-center flex items-center justify-center gap-1.5 font-jakarta"
                  >
                    <span>👁️ Pratinjau PDF</span>
                  </button>

                  <!-- Tombol Akses Kode / Video -->
                  <a
                    v-else-if="m.externalUrl || m.fileUrl"
                    :href="m.externalUrl || m.fileUrl!"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 py-1.5 px-2.5 rounded-xl bg-academic-navy/10 hover:bg-academic-navy/20 text-academic-navy font-bold text-[11px] transition text-center flex items-center justify-center gap-1.5 font-jakarta"
                  >
                    <span>{{ m.materialType === 'VIDEO' ? '▶️ Tonton Video' : '📥 Akses Kode' }}</span>
                  </a>

                  <!-- Tombol Hapus untuk Dosen / Admin -->
                  <button
                    v-if="authStore.isLecturer || authStore.isAdmin"
                    type="button"
                    @click="handleDeleteMaterial(m)"
                    title="Hapus Materi"
                    class="p-1.5 rounded-xl text-slate-400 hover:text-semantic-danger hover:bg-red-50 transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <!-- Tombol Status Bacaan Mahasiswa -->
                <button
                  type="button"
                  @click="handleToggleReadStatus(m)"
                  class="w-full py-1.5 px-2 rounded-xl text-[11px] font-medium transition flex items-center justify-center gap-1.5"
                  :class="m.isCompleted ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'"
                >
                  <span v-if="m.isCompleted">✓ Selesai Dipelajari</span>
                  <span v-else>○ Tandai Selesai Dibaca</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- MANAJEMEN TUGAS & PENGUMPULAN BERKAS (Strict Server-Side Timestamp Validation) -->
        <div class="space-y-4 pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Tugas Perkuliahan Sesi {{ selectedSession.sessionNumber }}
                </h4>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  {{ assignmentStore.assignments.length }} Tugas
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-inter mt-0.5">
                Pengumpulan berkas PDF/ZIP dengan validasi ketat batas normal (due_date) dan penutupan (cutoff_date).
              </p>
            </div>

            <!-- Tombol Buat Tugas untuk Dosen / Admin -->
            <button
              v-if="authStore.isLecturer || authStore.isAdmin"
              type="button"
              @click="isAddAssignmentOpen = true"
              class="px-3.5 py-1.5 rounded-xl bg-academic-navy hover:bg-blue-900 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 font-jakarta"
            >
              <span>+ Buat Tugas Baru</span>
            </button>
          </div>

          <!-- Loading State Tugas -->
          <div v-if="assignmentStore.isLoading" class="p-6 text-center space-y-2">
            <div class="w-6 h-6 border-2 border-academic-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
            <span class="text-xs text-slate-400 font-inter">Memuat data tugas...</span>
          </div>

          <!-- Empty State Tugas -->
          <div v-else-if="assignmentStore.assignments.length === 0" class="p-8 text-center rounded-2xl bg-alabaster-slate border border-slate-200 space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-xl">
              📝
            </div>
            <div class="space-y-1">
              <h5 class="text-xs font-bold text-academic-navy font-jakarta">Belum Ada Tugas Pada Sesi Ini</h5>
              <p class="text-[11px] text-slate-500 font-inter max-w-sm mx-auto">
                {{ authStore.isLecturer || authStore.isAdmin ? 'Klik tombol "+ Buat Tugas Baru" untuk menambahkan penugasan dengan parameter due_date dan cutoff_date.' : 'Tidak ada tugas yang dijadwalkan untuk pertemuan ini.' }}
              </p>
            </div>
          </div>

          <!-- Grid Daftar Tugas Perkuliahan -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="a in assignmentStore.assignments"
              :key="a.id"
              class="p-5 rounded-2xl border transition space-y-4 font-inter flex flex-col justify-between"
              :class="a.isClosed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200/90 hover:border-academic-navy shadow-xs'"
            >
              <div class="space-y-3">
                <!-- Top Row: Badge & Max Score -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-academic-navy border border-blue-200">
                      Tugas Sesi
                    </span>
                    <span class="text-[10px] font-mono text-slate-400">
                      Maks: {{ a.maxScore }} Poin
                    </span>
                  </div>

                  <!-- Status Tutup / Kadaluarsa -->
                  <span
                    v-if="a.isClosed"
                    class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-red-100 text-semantic-danger border border-red-200 uppercase"
                  >
                    Penutupan Berakhir
                  </span>
                  <span
                    v-else-if="a.isExpired"
                    class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase"
                  >
                    Batas Normal Lewat
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-semantic-success border border-emerald-200 uppercase"
                  >
                    Pengumpulan Aktif
                  </span>
                </div>

                <!-- Judul & Deskripsi -->
                <div>
                  <h5 class="text-sm font-bold text-academic-navy font-jakarta leading-snug">
                    {{ a.title }}
                  </h5>
                  <p v-if="a.description" class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {{ a.description }}
                  </p>
                </div>

                <!-- Jadwal Batas Waktu Normal vs Cutoff Date -->
                <div class="p-3 rounded-xl bg-alabaster-slate border border-slate-200 text-xs space-y-1.5 font-mono">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-500">Batas Normal (due_date):</span>
                    <span class="font-bold text-academic-navy">
                      {{ new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }} WIB
                    </span>
                  </div>

                  <div v-if="a.cutoffDate" class="flex items-center justify-between text-slate-600">
                    <span class="text-slate-500">Penutupan (cutoff_date):</span>
                    <span class="font-bold text-amber-800">
                      {{ new Date(a.cutoffDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }} WIB
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Format: {{ a.allowedFileTypes.toUpperCase() }}</span>
                    <span>Maks: {{ a.maxFileSizeMb }} MB</span>
                  </div>
                </div>

                <!-- Bagian Status Mahasiswa -->
                <div v-if="authStore.isStudent" class="pt-2 border-t border-slate-100">
                  <!-- State Sudah Dikumpulkan -->
                  <div v-if="a.mySubmission" class="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-slate-700 font-jakarta">Pengumpulan Anda:</span>
                      <!-- Status Ketepatan Waktu: Tepat Waktu (#16A34A) vs Terlambat (#DC2626) -->
                      <span
                        class="px-2 py-0.5 rounded font-mono text-[10px] font-bold text-white uppercase"
                        :style="{ backgroundColor: a.mySubmission.timingColor }"
                      >
                        ● {{ a.mySubmission.timingLabel }}
                      </span>
                    </div>

                    <div class="text-[11px] text-slate-500 font-mono">
                      <span>Terkirim: {{ new Date(a.mySubmission.submittedAt).toLocaleTimeString('id-ID') }} WIB</span>
                      <span v-if="a.mySubmission.fileName" class="block truncate">Berkas: {{ a.mySubmission.fileName }}</span>
                    </div>

                    <!-- Nilai Mahasiswa jika sudah dinilai -->
                    <div v-if="a.mySubmission.status === 'GRADED'" class="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between">
                      <span class="text-[11px] text-slate-600">Nilai Tugas:</span>
                      <span class="font-bold font-mono text-scholarly-teal text-xs">
                        {{ a.mySubmission.score }} / {{ a.maxScore }}
                      </span>
                    </div>
                  </div>

                  <!-- State Belum Mengumpulkan -->
                  <div v-else class="text-center py-2 text-xs text-slate-500 font-inter">
                    Anda belum mengumpulkan tugas ini.
                  </div>
                </div>
              </div>

              <!-- Action Row Buttons -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <!-- Dosen Controls -->
                <template v-if="authStore.isLecturer || authStore.isAdmin">
                  <button
                    type="button"
                    @click="handleOpenGradingSubmissions(a.id)"
                    class="flex-1 py-2 px-3 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white font-semibold text-xs font-jakarta transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>📋 Nilai Berkas ({{ a.submissionCount || 0 }})</span>
                  </button>

                  <button
                    type="button"
                    @click="handleOpenOverviewModal(a)"
                    class="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs font-jakarta transition flex items-center justify-center gap-1.5"
                    title="Ikhtisar Pengumpulan"
                  >
                    <span>📊 Ikhtisar</span>
                  </button>

                  <button
                    type="button"
                    @click="handleDeleteAssignment(a)"
                    title="Hapus Tugas"
                    class="p-2 rounded-xl text-slate-400 hover:text-semantic-danger hover:bg-red-50 transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </template>

                <!-- Mahasiswa Controls -->
                <template v-else>
                  <button
                    v-if="a.isClosed"
                    type="button"
                    disabled
                    class="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs font-jakarta cursor-not-allowed"
                  >
                    ⛔ Pengumpulan Ditutup (Melewati Batas Cutoff)
                  </button>

                  <button
                    v-else
                    type="button"
                    @click="handleOpenSubmitModal(a)"
                    class="w-full py-2 px-3 rounded-xl text-white font-semibold text-xs font-jakarta transition shadow-xs flex items-center justify-center gap-1.5"
                    :class="a.isExpired ? 'bg-semantic-danger hover:bg-red-700' : 'bg-scholarly-teal hover:bg-teal-700'"
                  >
                    <span v-if="a.mySubmission">🔄 Unggah Ulang Berkas Tugas</span>
                    <span v-else-if="a.isExpired">📤 Kumpulkan Tugas (Terlambat)</span>
                    <span v-else>📤 Kumpulkan Tugas (Tepat Waktu)</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- BAGIAN 3: UJIAN & KUIS PERKULIAHAN (FASE 3)    -->
        <!-- ============================================== -->
        <div class="space-y-4 pt-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-4 rounded-full bg-academic-navy"></span>
              <h4 class="text-sm font-bold text-academic-navy font-jakarta tracking-tight">
                Ujian & Evaluasi Sesi (Kuis / UTS / UAS)
              </h4>
            </div>
            <span class="text-xs font-mono font-semibold text-slate-500">
              {{ quizStore.sessionQuizzes.length }} Ujian Terdaftar
            </span>
          </div>

          <!-- Empty State Ujian -->
          <div
            v-if="quizStore.sessionQuizzes.length === 0"
            class="p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-2"
          >
            <span class="text-2xl">📝</span>
            <p class="text-xs font-semibold text-slate-600 font-jakarta">
              Tidak Ada Ujian Aktif pada Sesi Ini
            </p>
            <p class="text-[11px] text-slate-400 font-inter max-w-md mx-auto">
              {{ selectedSession?.sessionType === 'MIDTERM_EXAM' ? 'Sesi ini dijadwalkan untuk Evaluasi Ujian Tengah Semester (UTS).' : (selectedSession?.sessionType === 'FINAL_EXAM' ? 'Sesi ini dijadwalkan untuk Evaluasi Ujian Akhir Semester (UAS).' : 'Kuis mingguan dapat diselenggarakan pada pertemuan reguler sesuai silabus.') }}
            </p>
          </div>

          <!-- Grid Daftar Kuis & Ujian -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="q in quizStore.sessionQuizzes"
              :key="q.id"
              class="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-academic-navy transition space-y-4 font-inter shadow-xs flex flex-col justify-between"
            >
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider text-white"
                      :class="q.quizType === 'FINAL_EXAM' ? 'bg-red-600' : (q.quizType === 'MIDTERM_EXAM' ? 'bg-amber-600' : 'bg-scholarly-teal')"
                    >
                      {{ q.quizType }}
                    </span>
                    <span class="text-[10px] font-mono text-slate-400">
                      {{ q.durationMinutes }} Menit • {{ q.questionsCount }} Soal
                    </span>
                  </div>

                  <span
                    class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase"
                    :class="q.accessStatus === 'ACTIVE' ? 'bg-emerald-100 text-semantic-success' : (q.accessStatus === 'UPCOMING' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500')"
                  >
                    {{ q.accessStatus === 'ACTIVE' ? 'Sedang Berlangsung' : (q.accessStatus === 'UPCOMING' ? 'Belum Dimulai' : 'Ujian Ditutup') }}
                  </span>
                </div>

                <div>
                  <h5 class="text-sm font-bold text-academic-navy font-jakarta leading-snug">
                    {{ q.title }}
                  </h5>
                  <p v-if="q.description" class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {{ q.description }}
                  </p>
                </div>

                <!-- Info Jadwal & Passing Score -->
                <div class="p-3 rounded-xl bg-alabaster-slate border border-slate-200 text-xs space-y-1.5 font-mono">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-500">Mulai:</span>
                    <span class="font-bold text-slate-700">
                      {{ new Date(q.startTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-500">Selesai:</span>
                    <span class="font-bold text-slate-700">
                      {{ new Date(q.endTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Maks: {{ q.maxScore }} Poin</span>
                    <span>Kelulusan: {{ q.passingScore }} Poin</span>
                  </div>
                </div>

                <!-- Hasil Mahasiswa jika sudah pernah mencoba -->
                <div v-if="authStore.isStudent && q.myLatestAttempt" class="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-700 font-jakarta">Status Ujian Anda:</span>
                    <span class="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {{ q.myLatestAttempt.status }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between font-mono pt-1">
                    <span class="text-slate-500">Nilai Akhir:</span>
                    <span class="font-bold text-academic-navy text-sm">
                      {{ q.myLatestAttempt.score || q.myLatestAttempt.autoScore || '0.00' }} / {{ q.maxScore }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Row Buttons -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <!-- Dosen Controls -->
                <template v-if="authStore.isLecturer || authStore.isAdmin">
                  <button
                    type="button"
                    @click="handleOpenGradingQuizAttempts(q.id)"
                    class="w-full py-2 px-3 rounded-xl bg-academic-navy hover:bg-blue-900 text-white font-semibold text-xs font-jakarta transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>📋 Koreksi Lembar Jawaban & Esai</span>
                  </button>
                </template>

                <!-- Mahasiswa Controls -->
                <template v-else>
                  <button
                    type="button"
                    @click="handleStartExam(q.id)"
                    :disabled="q.accessStatus !== 'ACTIVE'"
                    class="w-full py-2.5 px-3 rounded-xl text-white font-bold text-xs font-jakarta transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                    :class="q.accessStatus === 'ACTIVE' ? 'bg-scholarly-teal hover:bg-teal-700 active:scale-95' : 'bg-slate-300 text-slate-500'"
                  >
                    <span v-if="q.myLatestAttempt && q.myLatestAttempt.status === 'IN_PROGRESS'">⚡ Lanjutkan Ujian Daring</span>
                    <span v-else-if="q.accessStatus === 'ACTIVE'">🚀 Mulai Kerjakan Ujian Daring</span>
                    <span v-else>Ujian Belum Dibuka / Selesai</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Bobot Komponen Penilaian Sesi Terkait -->
        <div class="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/60 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-scholarly-teal text-white flex items-center justify-center font-bold text-lg shrink-0">
              ⚖️
            </div>
            <div>
              <h5 class="text-xs font-bold text-academic-navy font-jakarta">
                Bobot Evaluasi Kelas Terintegrasi (Total 100%)
              </h5>
              <p class="text-[11px] text-slate-600 font-inter">
                Setiap sesi terhubung langsung ke skema bobot penilaian otomatis database Neon.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white text-scholarly-teal border border-teal-200">
              Kehadiran: 10%
            </span>
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white text-scholarly-teal border border-teal-200">
              UTS: 25%
            </span>
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white text-scholarly-teal border border-teal-200">
              UAS: 30%
            </span>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal Pratinjau PDF In-App -->
    <PdfViewerModal
      :is-open="isPdfModalOpen"
      :title="previewPdfTitle"
      :pdf-url="previewPdfUrl"
      @close="isPdfModalOpen = false"
    />

    <!-- Modal Tambah Materi (Dosen / Admin) -->
    <AddMaterialModal
      v-if="selectedSession"
      :is-open="isAddModalOpen"
      :session-id="selectedSession.id"
      :session-number="selectedSession.sessionNumber"
      @close="isAddModalOpen = false"
      @created="fetchMaterials(selectedSession?.id)"
    />

    <!-- Modal Buat Tugas Baru (Dosen / Admin) -->
    <AddAssignmentModal
      v-if="currentClass && selectedSession"
      :is-open="isAddAssignmentOpen"
      :class-id="currentClass.id"
      :session-id="selectedSession.id"
      :session-number="selectedSession.sessionNumber"
      @close="isAddAssignmentOpen = false"
      @created="fetchAssignments(selectedSession?.id)"
    />

    <!-- Modal Kumpulkan Tugas Berkas PDF/ZIP (Mahasiswa) -->
    <SubmitAssignmentModal
      :is-open="isSubmitAssignmentOpen"
      :assignment="selectedAssignmentForSubmit"
      @close="isSubmitAssignmentOpen = false"
      @submitted="fetchAssignments(selectedSession?.id)"
    />

    <!-- Modal Ikhtisar & Penilaian Pengumpulan Mahasiswa (Dosen / Admin) -->
    <AssignmentSubmissionsModal
      :is-open="isOverviewModalOpen"
      :overview="assignmentStore.currentOverview"
      @close="isOverviewModalOpen = false"
      @graded="fetchAssignments(selectedSession?.id)"
    />

    <!-- Modal Penilaian Berkas Tugas & Rubrik (Dosen / Admin - Fase 3) -->
    <GradingSubmissionsModal
      :is-open="isGradingSubmissionsOpen"
      :assignment-id="selectedAssignmentIdForGrading"
      @close="isGradingSubmissionsOpen = false"
    />

    <!-- Modal Penilaian Ujian Daring & Esai (Dosen / Admin - Fase 3) -->
    <GradingQuizAttemptsModal
      :is-open="isGradingQuizAttemptsOpen"
      :quiz-id="selectedQuizIdForGrading"
      @close="isGradingQuizAttemptsOpen = false"
    />
  </div>
</template>
