<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useEwsStore } from '~/stores/useEwsStore'
import { useGradebookStore } from '~/stores/useGradebookStore'
import type { StudentEwsProfileDto, LetterGrade } from '~/types'
import EwsInterventionModal from './EwsInterventionModal.vue'

const academicStore = useAcademicStore()
const ewsStore = useEwsStore()
const gradebookStore = useGradebookStore()

const currentClassId = computed(() => academicStore.selectedClassId)
const currentClass = computed(() => academicStore.selectedClassDetail || academicStore.selectedClass)

const isInterventionModalOpen = ref(false)
const selectedStudent = ref<StudentEwsProfileDto | null>(null)

const loadData = async () => {
  const classId = currentClassId.value
  if (!classId) return
  await Promise.all([
    ewsStore.fetchClassEws(classId),
    gradebookStore.fetchClassGradebook(classId)
  ])
}

watch(
  () => currentClassId.value,
  (newId) => {
    if (newId) loadData()
  },
  { immediate: true }
)

onMounted(() => {
  loadData()
})

const openIntervention = (student: StudentEwsProfileDto) => {
  selectedStudent.value = student
  isInterventionModalOpen.value = true
}

// -------------------------------------------------------------
// GRAFIK DISTRIBUSI INDEKS NILAI (A, AB, B, BC, C, D, E)
// -------------------------------------------------------------
interface GradeBarItem {
  letter: LetterGrade
  label: string
  range: string
  point: string
  count: number
  percentage: number
  color: string
  bgColor: string
}

const gradeBarData = computed<GradeBarItem[]>(() => {
  const dist = gradebookStore.gradeDistribution
  const total = gradebookStore.totalStudents || ewsStore.totalStudents || 1

  const definitions: { letter: LetterGrade; range: string; point: string; color: string; bgColor: string }[] = [
    { letter: 'A', range: '≥ 85.0', point: '4.00', color: '#16A34A', bgColor: '#DCFCE7' },
    { letter: 'AB', range: '80.0 - 84.9', point: '3.50', color: '#0D9488', bgColor: '#CCFBF1' },
    { letter: 'B', range: '70.0 - 79.9', point: '3.00', color: '#2563EB', bgColor: '#DBEAFE' },
    { letter: 'BC', range: '65.0 - 69.9', point: '2.50', color: '#4F46E5', bgColor: '#E0E7FF' },
    { letter: 'C', range: '55.0 - 64.9', point: '2.00', color: '#D97706', bgColor: '#FEF3C7' },
    { letter: 'D', range: '45.0 - 54.9', point: '1.00', color: '#EA580C', bgColor: '#FFEDD5' },
    { letter: 'E', range: '< 45.0 / Absen < 75%', point: '0.00', color: '#DC2626', bgColor: '#FEE2E2' }
  ]

  return definitions.map((def) => {
    const count = dist[def.letter] || 0
    const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    return {
      letter: def.letter,
      label: `Indeks ${def.letter}`,
      range: def.range,
      point: def.point,
      count,
      percentage: pct,
      color: def.color,
      bgColor: def.bgColor
    }
  })
})

const maxGradeCount = computed(() => {
  const counts = gradeBarData.value.map((b) => b.count)
  return Math.max(...counts, 1)
})
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
    <!-- ============================================== -->
    <!-- 1. HEADER BANNER UTAMA EWS                     -->
    <!-- ============================================== -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-semantic-danger text-xs font-semibold border border-rose-200 font-inter mb-2">
            <span class="w-2 h-2 rounded-full bg-semantic-danger animate-ping"></span>
            <span>Academic Early Warning System (EWS) Telemetry</span>
          </div>
          <h2 class="text-2xl font-bold text-academic-navy font-jakarta">
            Dashboard Analitik &amp; Peringatan Dini Akademik
          </h2>
          <p class="text-xs text-slate-500 font-inter mt-1 max-w-2xl">
            Deteksi dini mahasiswa berisiko tidak lulus berbasis pemantauan telemetri real-time: persentase presensi (ambang 75%), keterlambatan tugas, dan capaian skor ujian kuis/UTS standar ITW.
          </p>
        </div>

        <!-- Tombol Aksi Cepat Dosen -->
        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            @click="loadData"
            :disabled="ewsStore.isLoading"
            class="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <span v-if="ewsStore.isLoading" class="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
            <svg v-else class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sinkronkan Telemetri</span>
          </button>

          <!-- Quick Action Unduh Excel Rekap Nilai -->
          <a
            :href="`/api/reports/classes/${currentClassId}/gradebook`"
            download
            class="px-4 py-2.5 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-xs"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Unduh Excel Nilai</span>
          </a>

          <!-- Quick Action Cetak Dokumen Transkrip -->
          <a
            :href="`/api/reports/classes/${currentClassId}/transcript`"
            target="_blank"
            class="px-4 py-2.5 rounded-xl bg-academic-navy hover:bg-slate-800 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-xs"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak Transkrip</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 2. RINGKASAN METRIK TELEMETRI KELAS (5 KARTU)  -->
    <!-- ============================================== -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      <!-- Total Mahasiswa -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
          Total Mahasiswa
        </span>
        <p class="text-3xl font-black font-mono text-academic-navy">
          {{ ewsStore.totalStudents }}
        </p>
        <p class="text-[11px] text-slate-500 font-inter">Kelas {{ currentClass?.code || 'Aktif' }}</p>
      </div>

      <!-- Kategori Kritis -->
      <div class="p-5 rounded-3xl bg-rose-50/70 border border-rose-200 shadow-xs space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase tracking-wider text-rose-700 block font-bold">
            🔴 Kritis
          </span>
          <span class="w-2 h-2 rounded-full bg-semantic-danger animate-pulse"></span>
        </div>
        <p class="text-3xl font-black font-mono text-semantic-danger">
          {{ ewsStore.criticalCount }}
        </p>
        <p class="text-[11px] text-rose-700/80 font-inter font-medium">Intervensi Segera</p>
      </div>

      <!-- Kategori Waspada -->
      <div class="p-5 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-amber-800 block font-bold">
          🟡 Waspada
        </span>
        <p class="text-3xl font-black font-mono text-amber-alert">
          {{ ewsStore.warningCount }}
        </p>
        <p class="text-[11px] text-amber-800/80 font-inter font-medium">Pantau Ketat</p>
      </div>

      <!-- Kategori Aman -->
      <div class="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-800 block font-bold">
          🟢 Aman
        </span>
        <p class="text-3xl font-black font-mono text-semantic-success">
          {{ ewsStore.safeCount }}
        </p>
        <p class="text-[11px] text-emerald-800/80 font-inter font-medium">Sesuai Target</p>
      </div>

      <!-- Tingkat Risiko Kelas -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1 col-span-2 sm:col-span-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
          Rasio Mahasiswa Berisiko
        </span>
        <p class="text-3xl font-black font-mono text-academic-navy">
          {{ ewsStore.atRiskPercentage.toFixed(1) }}%
        </p>
        <p class="text-[11px] text-slate-500 font-inter">
          Rata-rata Skor: {{ ewsStore.averageCompositeRisk.toFixed(0) }}/100
        </p>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 3. GRAFIK DISTRIBUSI INDEKS & REKOMENDASI KLAS -->
    <!-- ============================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- KARTU KIRI: GRAFIK DISTRIBUSI INDEKS NILAI (A, AB, B, BC, C, D, E) -->
      <div class="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-academic-navy font-jakarta flex items-center gap-2">
              <svg class="w-4 h-4 text-scholarly-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Grafik Distribusi Indeks Nilai Mutu (A - E)</span>
            </h3>
            <p class="text-xs text-slate-500 font-inter mt-0.5">
              Skala standar ITW: A (≥85), AB (80-84.9), B (70-79.9), BC (65-69.9), C (55-64.9), D (45-54.9), E (&lt;45 atau Kehadiran &lt;75%).
            </p>
          </div>
          <span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
            Total: {{ gradebookStore.totalStudents }} Mhs
          </span>
        </div>

        <!-- DIAGRAM BATANG VISUAL (SVG / CSS COLUMNS) -->
        <div class="pt-6 pb-2">
          <div class="flex items-end justify-between gap-2 sm:gap-3 h-48 px-2 border-b border-slate-200">
            <div
              v-for="bar in gradeBarData"
              :key="bar.letter"
              class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
            >
              <!-- Popover Hover Info -->
              <div class="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-2 py-0.5 rounded shadow-md whitespace-nowrap mb-1">
                {{ bar.count }} Mhs ({{ bar.percentage }}%)
              </div>

              <!-- Bar Number Indicator -->
              <span class="text-xs font-bold font-mono text-slate-700">
                {{ bar.count }}
              </span>

              <!-- Animated Column Bar -->
              <div
                class="w-full max-w-[42px] rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-2xs"
                :style="{
                  height: `${Math.max((bar.count / maxGradeCount) * 100, 6)}%`,
                  backgroundColor: bar.color
                }"
              ></div>
            </div>
          </div>

          <!-- Grade Label Row Below Axis -->
          <div class="flex items-center justify-between gap-2 sm:gap-3 px-2 pt-2 text-center">
            <div
              v-for="bar in gradeBarData"
              :key="bar.letter"
              class="flex-1 text-center"
            >
              <span
                class="text-xs font-black font-mono px-2 py-0.5 rounded-lg inline-block"
                :style="{ backgroundColor: bar.bgColor, color: bar.color }"
              >
                {{ bar.letter }}
              </span>
              <span class="block text-[10px] font-mono text-slate-400 mt-1">
                {{ bar.percentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- KARTU KANAN: REKOMENDASI INTERVENSI KELAS -->
      <div class="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4 flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-academic-navy font-jakarta flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Rekomendasi Tindakan Intervensi Kelas</span>
            </h3>
            <span class="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Saran Sistem
            </span>
          </div>
          <p class="text-xs text-slate-500 font-inter">
            Tindakan pencegahan dini yang disarankan engine EWS berdasarkan telemetri keseluruhan rombongan belajar.
          </p>

          <!-- List of Recommendations -->
          <div class="space-y-2 pt-1">
            <div
              v-for="(rec, idx) in ewsStore.classInterventions"
              :key="idx"
              class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-inter flex items-start gap-2.5"
            >
              <span class="w-5 h-5 rounded-full bg-teal-100 text-scholarly-teal font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {{ idx + 1 }}
              </span>
              <span>{{ rec }}</span>
            </div>

            <div
              v-if="ewsStore.classInterventions.length === 0"
              class="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-inter text-center"
            >
              ✓ Seluruh indikator kelas berada pada kategori aman. Tidak diperlukan intervensi khusus saat ini.
            </div>
          </div>
        </div>

        <!-- Quick Access to Attendance Matrix Report -->
        <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 text-xs font-inter flex items-center justify-between gap-3">
          <div>
            <span class="font-bold text-academic-navy block font-jakarta">Laporan Matriks Presensi 16 Sesi</span>
            <span class="text-[11px] text-slate-500">Evaluasi kehadiran per sesi dan status UAS</span>
          </div>
          <a
            :href="`/api/reports/classes/${currentClassId}/attendance-matrix`"
            download
            class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs font-jakarta transition shadow-2xs shrink-0 flex items-center gap-1"
          >
            <span>Unduh XLSX</span>
          </a>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 4. TABEL & DAFTAR MAHASISWA BERISIKO TINGGI    -->
    <!-- ============================================== -->
    <section class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-academic-navy font-jakarta">
            Daftar Mahasiswa &amp; Telemetri Risiko Kelulusan
          </h3>
          <p class="text-xs text-slate-500 font-inter">
            Filter mahasiswa berdasarkan kategori risiko untuk memprioritaskan bimbingan dan intervensi.
          </p>
        </div>

        <!-- Filter Tab Buttons & Search -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Filter Buttons -->
          <div class="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              @click="ewsStore.setRiskFilter('ALL')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition"
              :class="ewsStore.activeRiskFilter === 'ALL' ? 'bg-white text-academic-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Semua ({{ ewsStore.totalStudents }})
            </button>
            <button
              type="button"
              @click="ewsStore.setRiskFilter('CRITICAL')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition flex items-center gap-1"
              :class="ewsStore.activeRiskFilter === 'CRITICAL' ? 'bg-semantic-danger text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              <span>🔴 Kritis</span>
              <span class="font-mono text-[10px]">({{ ewsStore.criticalCount }})</span>
            </button>
            <button
              type="button"
              @click="ewsStore.setRiskFilter('WARNING')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition flex items-center gap-1"
              :class="ewsStore.activeRiskFilter === 'WARNING' ? 'bg-amber-alert text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              <span>🟡 Waspada</span>
              <span class="font-mono text-[10px]">({{ ewsStore.warningCount }})</span>
            </button>
            <button
              type="button"
              @click="ewsStore.setRiskFilter('SAFE')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition flex items-center gap-1"
              :class="ewsStore.activeRiskFilter === 'SAFE' ? 'bg-semantic-success text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              <span>🟢 Aman</span>
              <span class="font-mono text-[10px]">({{ ewsStore.safeCount }})</span>
            </button>
          </div>

          <!-- Search Box -->
          <div class="w-full sm:w-56">
            <input
              v-model="ewsStore.searchQuery"
              type="text"
              placeholder="Cari nama atau NIM..."
              class="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal text-xs font-inter"
            />
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto border border-slate-200 rounded-2xl">
        <table class="w-full text-xs text-left font-inter">
          <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th class="py-3 px-3 text-center w-10">No</th>
              <th class="py-3 px-4 min-w-[180px]">Mahasiswa</th>
              <th class="py-3 px-3 text-center">Status Risiko</th>
              <th class="py-3 px-3 text-center">Skor Risiko</th>
              <th class="py-3 px-3 text-center">Presensi (Min 75%)</th>
              <th class="py-3 px-3 text-center">Tugas Terkumpul</th>
              <th class="py-3 px-3 text-center">Rata-rata Ujian</th>
              <th class="py-3 px-4 min-w-[200px]">Isu Terdeteksi</th>
              <th class="py-3 px-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(st, idx) in ewsStore.filteredStudents"
              :key="st.studentId"
              class="hover:bg-slate-50/50 transition"
              :class="{
                'bg-rose-50/30': st.overallRiskLevel === 'CRITICAL',
                'bg-amber-50/20': st.overallRiskLevel === 'WARNING'
              }"
            >
              <td class="py-3 px-3 text-center font-mono text-slate-500">{{ idx + 1 }}</td>
              <td class="py-3 px-4">
                <div class="font-bold text-academic-navy font-jakarta">{{ st.studentName }}</div>
                <div class="text-[10px] font-mono text-slate-500">
                  NIM: {{ st.studentNim || '-' }}
                </div>
              </td>

              <!-- Status Risiko Badge -->
              <td class="py-3 px-3 text-center">
                <span
                  class="px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] uppercase border"
                  :class="{
                    'bg-rose-100 text-rose-800 border-rose-300': st.overallRiskLevel === 'CRITICAL',
                    'bg-amber-100 text-amber-800 border-amber-300': st.overallRiskLevel === 'WARNING',
                    'bg-emerald-100 text-emerald-800 border-emerald-300': st.overallRiskLevel === 'SAFE'
                  }"
                >
                  {{ st.riskLabel }}
                </span>
              </td>

              <!-- Skor Risiko Komposit -->
              <td class="py-3 px-3 text-center font-mono font-bold text-xs" :style="{ color: st.riskColor }">
                {{ st.compositeRiskScore.toFixed(0) }} / 100
              </td>

              <!-- Presensi -->
              <td class="py-3 px-3 text-center font-mono">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="st.attendance.isDisqualified
                    ? 'bg-rose-100 text-rose-700'
                    : (st.attendance.isNearThreshold ? 'bg-amber-100 text-amber-700' : 'text-slate-700')"
                >
                  {{ st.attendance.attendancePercentage.toFixed(1) }}%
                </span>
                <span class="block text-[10px] text-slate-400">
                  ({{ st.attendance.attendedSessions }}/{{ st.attendance.totalSessions }})
                </span>
              </td>

              <!-- Tugas -->
              <td class="py-3 px-3 text-center font-mono">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="st.assignments.missingCount > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-700'"
                >
                  {{ st.assignments.submittedCount }}/{{ st.assignments.totalAssignments }}
                </span>
                <span v-if="st.assignments.missingCount > 0" class="block text-[10px] text-rose-600 font-semibold">
                  (-{{ st.assignments.missingCount }} tugas)
                </span>
              </td>

              <!-- Ujian (Kuis/UTS) -->
              <td class="py-3 px-3 text-center font-mono">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="st.exams.isBelowPassingStandard ? 'bg-rose-100 text-rose-700' : 'text-slate-700'"
                >
                  {{ st.exams.combinedExamAverage !== null ? st.exams.combinedExamAverage.toFixed(1) : '-' }}
                </span>
                <span class="block text-[10px] text-slate-400">
                  Std: 55.0
                </span>
              </td>

              <!-- Isu Terdeteksi -->
              <td class="py-3 px-4">
                <div class="space-y-0.5">
                  <div
                    v-for="(issue, iIdx) in [...st.attendance.issues, ...st.assignments.issues, ...st.exams.issues].slice(0, 2)"
                    :key="iIdx"
                    class="text-[10px] text-slate-600 flex items-center gap-1"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: st.riskColor }"></span>
                    <span class="truncate max-w-[200px]">{{ issue }}</span>
                  </div>
                  <span
                    v-if="[...st.attendance.issues, ...st.assignments.issues, ...st.exams.issues].length === 0"
                    class="text-[10px] text-emerald-600 font-medium"
                  >
                    ✓ Tidak ada anomali
                  </span>
                </div>
              </td>

              <!-- Tombol Aksi -->
              <td class="py-3 px-3 text-center">
                <button
                  type="button"
                  @click="openIntervention(st)"
                  class="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-[11px] font-jakarta transition text-slate-700 shadow-2xs whitespace-nowrap"
                >
                  Intervensi
                </button>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="ewsStore.filteredStudents.length === 0">
              <td colspan="9" class="p-8 text-center text-xs text-slate-400 font-inter">
                Tidak ada data mahasiswa yang cocok dengan filter atau pencarian.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal Detail Intervensi Mahasiswa -->
    <EwsInterventionModal
      v-model="isInterventionModalOpen"
      :student="selectedStudent"
      :course-name="currentClass?.courseName"
    />
  </div>
</template>
