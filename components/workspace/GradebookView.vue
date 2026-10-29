<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGradebookStore } from '~/stores/useGradebookStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAuthStore } from '~/stores/useAuthStore'
import type { StudentGradeBreakdownDto, LetterGrade, GradeStatus } from '~/types'
import ConfigureWeightsModal from './ConfigureWeightsModal.vue'
import ManualGradeAdjustModal from './ManualGradeAdjustModal.vue'
import GradeAuditLogsModal from './GradeAuditLogsModal.vue'

const gradebookStore = useGradebookStore()
const academicStore = useAcademicStore()
const authStore = useAuthStore()

// State Search & Filter
const searchQuery = ref('')
const isConfigureWeightsOpen = ref(false)
const isAuditLogsOpen = ref(false)
const isAdjustModalOpen = ref(false)
const isExportMenuOpen = ref(false)
const selectedStudentToAdjust = ref<StudentGradeBreakdownDto | null>(null)

const loadGradebook = async () => {
  const classId = academicStore.selectedClassId
  if (classId) {
    await gradebookStore.fetchClassGradebook(classId)
  }
}

onMounted(() => {
  loadGradebook()
})

watch(
  () => academicStore.selectedClassId,
  (newId) => {
    if (newId) loadGradebook()
  }
)

const gradebook = computed(() => gradebookStore.gradebook)
const students = computed(() => gradebook.value?.students || [])

// Filtered students by search
const filteredStudents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return students.value

  return students.value.filter((st) => {
    const matchName = st.studentName.toLowerCase().includes(q)
    const matchNim = st.studentNim ? st.studentNim.toLowerCase().includes(q) : false
    return matchName || matchNim
  })
})

const openAdjustModal = (student: StudentGradeBreakdownDto) => {
  selectedStudentToAdjust.value = student
  isAdjustModalOpen.value = true
}

const handleRecalculate = async () => {
  const classId = academicStore.selectedClassId
  if (classId) {
    await gradebookStore.calculateGradebook(classId)
  }
}

const handleStatusChange = async (status: GradeStatus) => {
  const classId = academicStore.selectedClassId
  if (classId) {
    await gradebookStore.updateGradeStatus(classId, status)
  }
}

const getLetterBadgeClass = (letter: LetterGrade) => {
  switch (letter) {
    case 'A':
      return 'bg-emerald-100 text-semantic-success border-emerald-300 font-black'
    case 'AB':
      return 'bg-teal-100 text-scholarly-teal border-teal-300 font-bold'
    case 'B':
      return 'bg-blue-100 text-academic-navy border-blue-300 font-bold'
    case 'BC':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 font-semibold'
    case 'C':
      return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
    case 'D':
      return 'bg-orange-100 text-orange-800 border-orange-300 font-semibold'
    case 'E':
      return 'bg-red-100 text-semantic-danger border-red-300 font-black'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
    <!-- ============================================== -->
    <!-- HEADER BUKU NILAI & KONTROL UTAMA             -->
    <!-- ============================================== -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-scholarly-teal text-xs font-semibold border border-teal-200 font-inter mb-2">
            <span>Buku Nilai Akademik Terpadu (Gradebook Engine)</span>
          </div>
          <h2 class="text-2xl font-bold text-academic-navy font-jakarta">
            {{ gradebook?.courseName || 'Buku Nilai Mata Kuliah' }}
          </h2>
          <p class="text-xs text-slate-500 font-inter mt-1 max-w-2xl">
            Kalkulasi otomatis Nilai Akhir (NA), konversi skala huruf mutu standar ITW (A, AB, B, BC, C, D, E), verifikasi batas presensi 75%, serta audit trail perubahan nilai.
          </p>
        </div>

        <!-- Tombol Aksi Dosen -->
        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            @click="isConfigureWeightsOpen = true"
            class="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-2xs"
          >
            <svg class="w-4 h-4 text-scholarly-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Bobot (100%)</span>
          </button>

          <button
            type="button"
            @click="handleRecalculate"
            :disabled="gradebookStore.isCalculating"
            class="px-4 py-2.5 rounded-xl bg-scholarly-teal hover:bg-teal-700 active:scale-95 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <span v-if="gradebookStore.isCalculating" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Hitung Ulang (NA)</span>
          </button>

          <button
            type="button"
            @click="isAuditLogsOpen = true"
            class="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-2xs"
          >
            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Audit Trail</span>
          </button>

          <!-- Tombol Aksi Cepat Unduh Excel & Cetak Transkrip -->
          <a
            v-if="academicStore.selectedClassId"
            :href="`/api/reports/classes/${academicStore.selectedClassId}/gradebook`"
            download
            class="px-3.5 py-2.5 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-xs shrink-0"
            title="Unduh Rekap Nilai Format Spreadsheet Excel (.xlsx)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Unduh Excel</span>
          </a>

          <a
            v-if="academicStore.selectedClassId"
            :href="`/api/reports/classes/${academicStore.selectedClassId}/transcript`"
            target="_blank"
            class="px-3.5 py-2.5 rounded-xl bg-academic-navy hover:bg-slate-800 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-xs shrink-0"
            title="Buka Dokumen Cetak Transkrip Nilai Resmi ITW"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak Transkrip</span>
          </a>

          <!-- Ekspor & Cetak Laporan Dropdown -->
          <div class="relative">
            <button
              type="button"
              @click="isExportMenuOpen = !isExportMenuOpen"
              class="px-4 py-2.5 rounded-xl bg-academic-navy hover:bg-slate-800 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Ekspor &amp; Cetak</span>
              <svg class="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isExportMenuOpen"
              class="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              @mouseleave="isExportMenuOpen = false"
            >
              <div class="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Format Spreadsheet Excel (.xlsx)
              </div>
              <a
                :href="`/api/reports/classes/${academicStore.selectedClassId}/gradebook`"
                download
                @click="isExportMenuOpen = false"
                class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <span class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                  XLS
                </span>
                <div>
                  <div class="font-bold font-jakarta text-slate-800">Rekap Nilai Akhir</div>
                  <div class="text-[10px] text-slate-500">Nilai lengkap, NA, &amp; Indeks A-E</div>
                </div>
              </a>
              <a
                :href="`/api/reports/classes/${academicStore.selectedClassId}/attendance-matrix`"
                download
                @click="isExportMenuOpen = false"
                class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <span class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                  XLS
                </span>
                <div>
                  <div class="font-bold font-jakarta text-slate-800">Matriks Presensi 16 Sesi</div>
                  <div class="text-[10px] text-slate-500">H/T/I/S/A &amp; Kelayakan UAS</div>
                </div>
              </a>

              <div class="my-1.5 border-t border-slate-100"></div>

              <div class="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Dokumen Laporan Cetak Resmi
              </div>
              <a
                :href="`/api/reports/classes/${academicStore.selectedClassId}/transcript`"
                target="_blank"
                @click="isExportMenuOpen = false"
                class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  DOC
                </span>
                <div>
                  <div class="font-bold font-jakarta text-slate-800">Transkrip Nilai Kelas</div>
                  <div class="text-[10px] text-slate-500">Kop ITW &amp; Lembar Pengesahan</div>
                </div>
              </a>
              <a
                :href="`/api/reports/classes/${academicStore.selectedClassId}/berita-acara`"
                target="_blank"
                @click="isExportMenuOpen = false"
                class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  DOC
                </span>
                <div>
                  <div class="font-bold font-jakarta text-slate-800">Berita Acara Perkuliahan</div>
                  <div class="text-[10px] text-slate-500">Log 16 Pertemuan &amp; Paraf Dosen</div>
                </div>
              </a>
            </div>
          </div>

          <!-- Publikasi Nilai Dropdown / Button -->
          <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <span class="text-[10px] font-mono text-slate-500 font-semibold px-2 uppercase">Status:</span>
            <button
              type="button"
              @click="handleStatusChange('PUBLISHED')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition"
              :class="gradebook?.students[0]?.finalGrade.status === 'PUBLISHED' ? 'bg-semantic-success text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'"
            >
              Publikasikan
            </button>
            <button
              type="button"
              @click="handleStatusChange('DRAFT')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition"
              :class="gradebook?.students[0]?.finalGrade.status === 'DRAFT' ? 'bg-amber-alert text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'"
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      <!-- Ringkasan Statistik Kelas & Distribusi Nilai Huruf -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 text-center">
          <span class="text-[10px] text-slate-500 font-inter uppercase tracking-wider block">Mahasiswa</span>
          <span class="text-xl font-black font-mono text-academic-navy mt-1 block">
            {{ gradebook?.totalStudents || 0 }}
          </span>
          <span class="text-[10px] text-slate-400 font-inter">Peserta Terdaftar</span>
        </div>

        <div class="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 text-center">
          <span class="text-[10px] text-scholarly-teal font-inter uppercase tracking-wider block">Rata-rata NA</span>
          <span class="text-xl font-black font-mono text-scholarly-teal mt-1 block">
            {{ gradebook?.averageFinalScore !== null ? gradebook?.averageFinalScore?.toFixed(2) : '0.00' }}
          </span>
          <span class="text-[10px] text-teal-600 font-inter">Rata-rata Kelas</span>
        </div>

        <!-- Grade Distribution Cards -->
        <div
          v-for="letter in (['A', 'AB', 'B', 'BC', 'C', 'D', 'E'] as LetterGrade[])"
          :key="letter"
          class="p-3.5 rounded-2xl border text-center transition"
          :class="getLetterBadgeClass(letter)"
        >
          <span class="text-xs font-mono font-black block">Huruf {{ letter }}</span>
          <span class="text-lg font-black font-mono mt-0.5 block">
            {{ gradebookStore.gradeDistribution[letter] || 0 }}
          </span>
          <span class="text-[9px] opacity-75 font-inter">Mahasiswa</span>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- TABEL UTAMA GRADEBOOK                          -->
    <!-- ============================================== -->
    <section class="bg-white rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden space-y-4">
      <div class="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-academic-navy font-jakarta">
            Rekapitulasi Evaluasi & Nilai Mahasiswa
          </h3>
          <p class="text-xs text-slate-500 font-inter mt-0.5">
            Komposisi nilai mencakup Presensi (10%), Tugas (20%), Kuis (15%), UTS (25%), dan UAS (30%).
          </p>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full sm:w-72">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari Nama atau NIM..."
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 font-inter text-xs text-deep-ink focus:ring-2 focus:ring-scholarly-teal focus:border-scholarly-teal bg-white"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Tabel Scrollable Horizontal -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-inter border-collapse">
          <thead class="bg-slate-50 text-slate-600 font-semibold font-jakarta border-b border-slate-200 whitespace-nowrap">
            <tr>
              <th class="py-3 px-4">Mahasiswa</th>
              <th class="py-3 px-3">Presensi (10%)</th>
              <th class="py-3 px-3">Tugas (20%)</th>
              <th class="py-3 px-3">Kuis (15%)</th>
              <th class="py-3 px-3">UTS (25%)</th>
              <th class="py-3 px-3">UAS (30%)</th>
              <th class="py-3 px-3">Nilai Akhir (NA)</th>
              <th class="py-3 px-3">Huruf</th>
              <th class="py-3 px-3">Indeks (IP)</th>
              <th class="py-3 px-3">Status</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-mono text-slate-700">
            <tr v-if="filteredStudents.length === 0">
              <td colspan="11" class="py-10 text-center text-slate-400 font-inter">
                Tidak ada data mahasiswa yang sesuai dengan pencarian.
              </td>
            </tr>

            <tr
              v-for="st in filteredStudents"
              :key="st.studentId"
              class="hover:bg-slate-50/70 transition"
            >
              <!-- Mahasiswa info -->
              <td class="py-3.5 px-4 font-sans whitespace-nowrap">
                <div class="font-bold text-deep-ink font-jakarta">{{ st.studentName }}</div>
                <div class="font-mono text-[10px] text-slate-400">{{ st.studentNim || '-' }}</div>
              </td>

              <!-- Presensi -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold" :class="st.attendance.isEligible ? 'text-deep-ink' : 'text-semantic-danger'">
                    {{ st.attendance.score.toFixed(1) }}
                  </span>
                  <span
                    v-if="!st.attendance.isEligible"
                    class="text-[9px] font-sans px-1.5 py-0.2 rounded bg-red-100 text-semantic-danger font-bold"
                    title="Kehadiran < 75%: Diskualifikasi nilai menjadi E"
                  >
                    &lt; 75% (E)
                  </span>
                </div>
                <span class="text-[10px] text-slate-400 font-sans block">
                  {{ st.attendance.attendedSessions }}/{{ st.attendance.totalSessions }} Sesi
                </span>
              </td>

              <!-- Rata-rata Tugas -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="font-bold">{{ st.assignment.averageScore.toFixed(1) }}</span>
                <span class="text-[10px] text-slate-400 font-sans block">
                  {{ st.assignment.gradedCount }}/{{ st.assignment.totalAssignments }} Dinilai
                </span>
              </td>

              <!-- Rata-rata Kuis -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="font-bold">{{ st.quiz.averageScore.toFixed(1) }}</span>
                <span class="text-[10px] text-slate-400 font-sans block">
                  {{ st.quiz.gradedCount }}/{{ st.quiz.totalQuizzes }} Kuis
                </span>
              </td>

              <!-- UTS (Pertemuan 8) -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="font-bold">
                  {{ st.midtermExam.score !== null ? st.midtermExam.score.toFixed(1) : '-' }}
                </span>
              </td>

              <!-- UAS (Pertemuan 16) -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="font-bold">
                  {{ st.finalExam.score !== null ? st.finalExam.score.toFixed(1) : '-' }}
                </span>
              </td>

              <!-- Nilai Akhir (NA) di JetBrains Mono -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="text-sm font-black text-academic-navy bg-slate-100 px-2 py-1 rounded-lg">
                  {{ st.finalGrade.numericScore.toFixed(2) }}
                </span>
              </td>

              <!-- Huruf Mutu -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span
                  class="text-xs font-bold px-2.5 py-1 rounded-lg border font-mono"
                  :class="getLetterBadgeClass(st.finalGrade.letterGrade)"
                >
                  {{ st.finalGrade.letterGrade }}
                </span>
              </td>

              <!-- Bobot Indeks SKS (IP) -->
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="font-bold text-slate-700">
                  {{ st.finalGrade.gradePoint.toFixed(2) }}
                </span>
              </td>

              <!-- Status Nilai -->
              <td class="py-3.5 px-3 whitespace-nowrap font-sans">
                <span
                  class="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
                  :class="st.finalGrade.status === 'PUBLISHED' ? 'bg-emerald-100 text-semantic-success' : 'bg-slate-100 text-slate-600'"
                >
                  {{ st.finalGrade.status }}
                </span>
              </td>

              <!-- Tombol Sesuaikan Nilai -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap font-sans">
                <button
                  type="button"
                  @click="openAdjustModal(st)"
                  class="px-3 py-1.5 rounded-xl border border-slate-300 hover:border-scholarly-teal hover:text-scholarly-teal text-slate-700 font-bold text-xs font-jakarta transition shadow-2xs"
                >
                  Sesuaikan
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Submodals -->
    <ConfigureWeightsModal
      :is-open="isConfigureWeightsOpen"
      @close="isConfigureWeightsOpen = false"
    />

    <GradeAuditLogsModal
      :is-open="isAuditLogsOpen"
      @close="isAuditLogsOpen = false"
    />

    <ManualGradeAdjustModal
      :is-open="isAdjustModalOpen"
      :student="selectedStudentToAdjust"
      @close="isAdjustModalOpen = false"
    />
  </div>
</template>
