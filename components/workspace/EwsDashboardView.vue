<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useEwsStore } from '~/stores/useEwsStore'
import { useGradebookStore } from '~/stores/useGradebookStore'
import { useAuthStore } from '~/stores/useAuthStore'
import type { StudentEwsProfileDto, LetterGrade } from '~/types'
import EwsInterventionModal from './EwsInterventionModal.vue'

const academicStore = useAcademicStore()
const ewsStore = useEwsStore()
const gradebookStore = useGradebookStore()
const authStore = useAuthStore()

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
  range: string
  point: string
  count: number
  percentage: number
  barColor: string
}

// Warna bar minimalis sesuai PRD: 0 → abu-abu tipis, nilai lulus → Academic Navy,
// D → Amber Alert, E → Semantic Danger.
const gradeBarColor = (letter: LetterGrade, count: number): string => {
  if (count <= 0) return '#F1F5F9'
  if (letter === 'E') return '#DC2626'
  if (letter === 'D') return '#D97706'
  return '#1E3A8A'
}

const gradeBarData = computed<GradeBarItem[]>(() => {
  const dist = gradebookStore.gradeDistribution
  const total = gradebookStore.totalStudents || ewsStore.totalStudents || 1

  const definitions: { letter: LetterGrade; range: string; point: string }[] = [
    { letter: 'A', range: '≥ 85.0', point: '4.00' },
    { letter: 'AB', range: '80.0 - 84.9', point: '3.50' },
    { letter: 'B', range: '70.0 - 79.9', point: '3.00' },
    { letter: 'BC', range: '65.0 - 69.9', point: '2.50' },
    { letter: 'C', range: '55.0 - 64.9', point: '2.00' },
    { letter: 'D', range: '45.0 - 54.9', point: '1.00' },
    { letter: 'E', range: '< 45.0 / Absen < 75%', point: '0.00' }
  ]

  return definitions.map((def) => {
    const count = dist[def.letter] || 0
    const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    return {
      letter: def.letter,
      range: def.range,
      point: def.point,
      count,
      percentage: pct,
      barColor: gradeBarColor(def.letter, count)
    }
  })
})

const maxGradeCount = computed(() => {
  const counts = gradeBarData.value.map((b) => b.count)
  return Math.max(...counts, 1)
})

// Tinggi batang relatif terhadap tinggi area chart (track 176px).
// Dibatasi 82% agar ruang tersisa untuk angka jumlah dan tooltip hover.
const barHeightPercent = (bar: GradeBarItem) => {
  const ratio = (bar.count / maxGradeCount.value) * 100
  return Math.max(Math.min(ratio, 82), 6)
}

// Aksen border kiri per rekomendasi, mengikuti kategori risikonya
const interventionAccent = (rec: string) => {
  if (/kritis/i.test(rec)) return '#DC2626'
  if (/waspada/i.test(rec)) return '#D97706'
  return '#1E3A8A'
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
    <!-- ============================================== -->
    <!-- 1. HEADER BANNER UTAMA EWS                     -->
    <!-- ============================================== -->
    <section class="bg-white rounded-sm p-6 sm:p-7 shadow-none border border-slate-200 space-y-5">
      <!-- Baris atas: Eyebrow + Judul + Deskripsi -->
      <div class="space-y-1.5">
        <span class="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-scholarly-teal">
          Pemantauan Akademik &amp; EWS
        </span>
        <h2 class="text-xl sm:text-2xl font-bold text-academic-navy font-jakarta">
          Peringatan Dini &amp; Analitik Kelas
        </h2>
        <p class="text-xs text-slate-500 font-inter max-w-3xl">
          Deteksi dini mahasiswa berisiko tidak lulus berdasarkan pemantauan presensi (ambang 75%), keterlambatan tugas, dan capaian skor ujian.
        </p>
      </div>

      <!-- Baris Action Toolbar (tumpuk penuh, tombol ringkas h-9) -->
      <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
        <!-- Secondary: Perbarui Data -->
        <button
          type="button"
          @click="loadData"
          :disabled="ewsStore.isLoading"
          class="h-9 px-3.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs font-jakarta transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <span v-if="ewsStore.isLoading" class="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
          <svg v-else class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Perbarui Data</span>
        </button>

        <!-- Primary: Ekspor Laporan EWS -->
        <a
          :href="`/api/reports/classes/${currentClassId}/gradebook`"
          download
          class="h-9 px-3.5 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Ekspor Laporan EWS</span>
        </a>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 2. RINGKASAN METRIK TELEMETRI KELAS (5 KARTU)  -->
    <!-- ============================================== -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      <!-- Total Mahasiswa -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 space-y-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
          Total Mahasiswa
        </span>
        <p class="text-3xl font-black font-mono text-[#0F172A]">
          {{ ewsStore.totalStudents }}
        </p>
        <p class="text-[11px] text-slate-500 font-inter">Kelas {{ currentClass?.code || 'Aktif' }}</p>
      </div>

      <!-- Kategori Kritis -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
            Kritis
          </span>
          <span class="w-2 h-2 rounded-full bg-[#DC2626]"></span>
        </div>
        <p class="text-3xl font-black font-mono text-[#DC2626]">
          {{ ewsStore.criticalCount }}
        </p>
        <p class="text-[11px] text-slate-500 font-inter">Intervensi Segera</p>
      </div>

      <!-- Kategori Waspada -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
            Waspada
          </span>
          <span class="w-2 h-2 rounded-full bg-[#D97706]"></span>
        </div>
        <p class="text-3xl font-black font-mono text-[#D97706]">
          {{ ewsStore.warningCount }}
        </p>
        <p class="text-[11px] text-slate-500 font-inter">Pantau Ketat</p>
      </div>

      <!-- Kategori Aman -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
            Aman
          </span>
          <span class="w-2 h-2 rounded-full bg-[#16A34A]"></span>
        </div>
        <p class="text-3xl font-black font-mono text-[#16A34A]">
          {{ ewsStore.safeCount }}
        </p>
        <p class="text-[11px] text-slate-500 font-inter">Sesuai Target</p>
      </div>

      <!-- Tingkat Risiko Kelas -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 space-y-1 col-span-2 sm:col-span-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
          Rasio Risiko
        </span>
        <p class="text-3xl font-black font-mono text-[#0F172A]">
          {{ ewsStore.atRiskPercentage.toFixed(1) }}%
        </p>
        <p class="text-[11px] text-slate-500 font-inter">
          Rata-rata: {{ ewsStore.averageCompositeRisk.toFixed(0) }}/100
        </p>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 3. GRAFIK DISTRIBUSI INDEKS & REKOMENDASI KLAS -->
    <!-- ============================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- KARTU KIRI: GRAFIK DISTRIBUSI INDEKS NILAI (A, AB, B, BC, C, D, E) -->
      <div class="lg:col-span-7 bg-white rounded-xl p-6 shadow-xs border border-slate-200/90 space-y-5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-bold text-academic-navy font-jakarta flex items-center gap-2">
            <svg class="w-4 h-4 text-scholarly-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Grafik Distribusi Indeks Nilai Mutu (A - E)</span>
          </h3>
          <span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl shrink-0">
            Total: {{ gradebookStore.totalStudents }} Mhs
          </span>
        </div>

        <!-- Rincian skala nilai dipindah ke baris tersendiri agar tidak menabrak badge Total -->
        <p class="text-[11px] text-slate-500 font-inter leading-relaxed">
          Skala standar ITW: A ≥ 85 • AB 80-84.9 • B 70-79.9 • BC 65-69.9 • C 55-64.9 • D 45-54.9 • E &lt; 45 atau Kehadiran &lt; 75%
        </p>

        <!-- DIAGRAM BATANG: satu grid-cols-7, tiap kolom = batang + jumlah + huruf + persen -->
        <div class="pt-6 pb-2">
          <div class="grid grid-cols-7 gap-1 sm:gap-3">
            <div
              v-for="bar in gradeBarData"
              :key="bar.letter"
              class="flex flex-col items-center group cursor-pointer"
            >
              <!-- Area batang: tinggi tetap, batang menempel di bawah -->
              <div class="relative w-full h-44">
                <!-- Tooltip hover (absolut → tidak memengaruhi lebar kolom) -->
                <div
                  class="absolute top-0 left-1/2 -translate-x-1/2 z-10 text-[10px] font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  {{ bar.count }} Mhs · {{ bar.percentage }}% · IP {{ bar.point }}
                </div>

                <!-- Angka jumlah mahasiswa, menempel tepat di atas batang -->
                <span
                  class="absolute left-1/2 -translate-x-1/2 text-xs font-bold font-mono text-slate-700"
                  :style="{ bottom: `calc(${barHeightPercent(bar)}% + 6px)` }"
                >
                  {{ bar.count }}
                </span>

                <!-- Batang -->
                <div
                  class="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[42px] rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-2xs"
                  :style="{ height: `${barHeightPercent(bar)}%`, backgroundColor: bar.barColor }"
                ></div>
              </div>

              <!-- Label huruf (teks bersih, tanpa kapsul warna) -->
              <span class="mt-2 text-xs font-black font-mono text-slate-700">
                {{ bar.letter }}
              </span>

              <!-- Persentase -->
              <span class="mt-1 text-[10px] font-mono text-slate-400">
                {{ bar.percentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- KARTU KANAN: REKOMENDASI INTERVENSI KELAS -->
      <div class="lg:col-span-5 bg-white rounded-xl p-6 shadow-xs border border-slate-200/90 space-y-4 flex flex-col justify-between">
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-academic-navy font-jakarta">
            Rekomendasi Tindakan Intervensi Kelas
          </h3>
          <p class="text-xs text-slate-500 font-inter">
            Tindakan akademik yang disarankan berdasarkan capaian nilai dan presensi kelas.
          </p>

          <!-- List of Recommendations -->
          <div class="space-y-2 pt-1">
            <div
              v-for="(rec, idx) in ewsStore.classInterventions"
              :key="idx"
              class="py-2.5 pl-3 pr-3 rounded-r-lg bg-slate-50 border-l-2 text-xs text-slate-700 font-inter leading-relaxed"
              :style="{ borderLeftColor: interventionAccent(rec) }"
            >
              <span class="font-mono text-[10px] font-bold text-slate-400 mr-1.5">{{ idx + 1 }}.</span>
              <span>{{ rec }}</span>
            </div>

            <div
              v-if="ewsStore.classInterventions.length === 0"
              class="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-inter text-center"
            >
              Seluruh indikator kelas berada pada kategori aman. Tidak diperlukan intervensi khusus saat ini.
            </div>
          </div>
        </div>

        <!-- Quick Access to Attendance Matrix Report -->
        <div class="px-3.5 py-2.5 rounded-lg bg-alabaster-slate border border-slate-200 text-xs font-inter flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <svg class="w-4 h-4 text-scholarly-teal shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m4 2v-4m4 4v-6m2 10H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
            </svg>
            <div class="min-w-0">
              <span class="block font-bold text-academic-navy font-jakarta truncate">Laporan Matriks Presensi 16 Sesi</span>
              <span class="block text-[11px] text-slate-500 truncate">Evaluasi kehadiran per sesi dan status UAS</span>
            </div>
          </div>
          <a
            :href="`/api/reports/classes/${currentClassId}/attendance-matrix`"
            download
            class="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs font-jakarta transition shrink-0 flex items-center gap-1 whitespace-nowrap"
          >
            <span>Unduh XLSX</span>
          </a>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 4. TABEL & DAFTAR MAHASISWA BERISIKO TINGGI    -->
    <!-- ============================================== -->
    <section
      v-if="authStore.isAdmin"
      class="bg-white rounded-xl p-6 shadow-xs border border-slate-200/90 space-y-4"
    >
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
              <span>Kritis</span>
              <span class="font-mono text-[10px]">({{ ewsStore.criticalCount }})</span>
            </button>
            <button
              type="button"
              @click="ewsStore.setRiskFilter('WARNING')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition flex items-center gap-1"
              :class="ewsStore.activeRiskFilter === 'WARNING' ? 'bg-amber-alert text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              <span>Waspada</span>
              <span class="font-mono text-[10px]">({{ ewsStore.warningCount }})</span>
            </button>
            <button
              type="button"
              @click="ewsStore.setRiskFilter('SAFE')"
              class="px-3 py-1 rounded-lg text-xs font-bold font-jakarta transition flex items-center gap-1"
              :class="ewsStore.activeRiskFilter === 'SAFE' ? 'bg-semantic-success text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              <span>Aman</span>
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
                    Tidak ada anomali
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

    <!-- Catatan Pembatasan Akses Telemetri Individual -->
    <section
      v-else
      class="bg-white rounded-xl p-6 border border-slate-200/90 flex items-start gap-3"
    >
      <svg class="w-5 h-5 shrink-0 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <div>
        <h3 class="text-sm font-bold text-academic-navy font-jakarta">Telemetri Risiko Individual Terbatas</h3>
        <p class="text-xs text-slate-500 font-inter mt-1">
          Ringkasan risiko kelas di atas tersedia untuk Anda. Rincian telemetri risiko per mahasiswa
          hanya dapat diakses oleh Administrator untuk keperluan bimbingan akademik.
        </p>
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
