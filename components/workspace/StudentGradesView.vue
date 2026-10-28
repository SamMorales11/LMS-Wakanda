<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGradebookStore } from '~/stores/useGradebookStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAuthStore } from '~/stores/useAuthStore'
import type { LetterGrade } from '~/types'

const gradebookStore = useGradebookStore()
const academicStore = useAcademicStore()
const authStore = useAuthStore()

// State Simulasi Target Nilai UAS
const selectedTargetGrade = ref<'A' | 'AB' | 'B' | 'CUSTOM'>('A')
const customTargetNA = ref<number>(85.0)

const loadMyGrade = async () => {
  const classId = academicStore.selectedClassId
  if (classId) {
    await gradebookStore.fetchMyGrade(classId)
  }
}

onMounted(() => {
  loadMyGrade()
})

watch(
  () => academicStore.selectedClassId,
  (newId) => {
    if (newId) loadMyGrade()
  }
)

const myGrade = computed(() => gradebookStore.myGrade)

// Bobot komponen aktual dari data breakdown atau default
const weights = computed(() => {
  return {
    attendance: myGrade.value?.attendance.weightPercentage ?? 10.0,
    assignment: myGrade.value?.assignment.weightPercentage ?? 20.0,
    quiz: myGrade.value?.quiz.weightPercentage ?? 15.0,
    midterm: myGrade.value?.midtermExam.weightPercentage ?? 25.0,
    finalExam: myGrade.value?.finalExam.weightPercentage ?? 30.0
  }
})

// Akumulasi skor berjalan sebelum UAS:
// S_current = (W_absen * Skor_Presensi) + (W_tugas * Rata_Tugas) + (W_kuis * Rata_Kuis) + (W_UTS * Skor_UTS)
const currentPartialWeightedPoints = computed(() => {
  if (!myGrade.value) return 0

  const pAttendance = (weights.value.attendance * myGrade.value.attendance.score)
  const pAssignment = (weights.value.assignment * myGrade.value.assignment.averageScore)
  const pQuiz = (weights.value.quiz * myGrade.value.quiz.averageScore)
  const pMidterm = (weights.value.midterm * (myGrade.value.midtermExam.score ?? 0))

  return (pAttendance + pAssignment + pQuiz + pMidterm) / 100
})

// Ambang batas NA untuk target huruf mutu
const targetThresholdScore = computed(() => {
  switch (selectedTargetGrade.value) {
    case 'A':
      return 85.0
    case 'AB':
      return 80.0
    case 'B':
      return 70.0
    case 'CUSTOM':
      return customTargetNA.value
  }
})

// Perhitungan Skor Minimal UAS yang Dibutuhkan:
// Skor_UAS_min = ((NA_target * 100) - (S_current * 100)) / W_UAS
const requiredFinalExamScore = computed(() => {
  const targetNA = targetThresholdScore.value
  const currentPoints = currentPartialWeightedPoints.value
  const uasWeight = weights.value.finalExam

  if (uasWeight <= 0) return 0

  const neededWeightedPoints = targetNA - currentPoints
  const neededScore = (neededWeightedPoints * 100) / uasWeight
  return Math.round(neededScore * 10) / 10
})

// Nilai Akhir Maksimum yang mungkin jika UAS = 100
const maxPossibleFinalScore = computed(() => {
  const currentPoints = currentPartialWeightedPoints.value
  const maxUasPoints = (weights.value.finalExam * 100) / 100
  return Math.round((currentPoints + maxUasPoints) * 100) / 100
})

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
    <!-- HEADER EVALUASI AKADEMIK MAHASISWA            -->
    <!-- ============================================== -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-scholarly-teal text-xs font-semibold border border-teal-200 font-inter mb-2">
            <span>Transparansi Penilaian Akademik</span>
          </div>
          <h2 class="text-2xl font-bold text-academic-navy font-jakarta">
            Capaian Akademik & Rapor Berjalan
          </h2>
          <p class="text-xs text-slate-500 font-inter mt-1 max-w-xl">
            Rincian nilai transparan sesuai bobot resmi kelas. Evaluasi diproses menggunakan Strict Server-Side Timestamp dan batas kelulusan presensi 75%.
          </p>
        </div>

        <!-- Kartu Standing Nilai Saat Ini -->
        <div class="flex items-center gap-3 p-4 sm:p-5 rounded-2xl bg-alabaster-slate border border-slate-200 shrink-0">
          <div class="text-center px-3 border-r border-slate-200">
            <span class="text-[10px] text-slate-500 font-inter uppercase tracking-wider block">Nilai Akhir (NA)</span>
            <span class="text-3xl font-black font-mono text-academic-navy block mt-0.5">
              {{ myGrade?.finalGrade.numericScore !== undefined ? myGrade.finalGrade.numericScore.toFixed(2) : '0.00' }}
            </span>
          </div>

          <div class="text-center px-3 border-r border-slate-200">
            <span class="text-[10px] text-slate-500 font-inter uppercase tracking-wider block">Huruf Mutu</span>
            <span
              class="text-2xl font-black font-mono block mt-0.5 px-3 py-0.5 rounded-lg border"
              :class="myGrade ? getLetterBadgeClass(myGrade.finalGrade.letterGrade) : 'bg-slate-100 text-slate-600'"
            >
              {{ myGrade?.finalGrade.letterGrade || 'E' }}
            </span>
          </div>

          <div class="text-center px-3">
            <span class="text-[10px] text-slate-500 font-inter uppercase tracking-wider block">Indeks (IP)</span>
            <span class="text-2xl font-black font-mono text-slate-700 block mt-0.5">
              {{ myGrade?.finalGrade.gradePoint !== undefined ? myGrade.finalGrade.gradePoint.toFixed(2) : '0.00' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Warning Banner Jika Presensi < 75% (Diskualifikasi Otomatis E) -->
      <div
        v-if="myGrade && !myGrade.attendance.isEligible"
        class="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3.5 text-semantic-danger"
      >
        <div class="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 font-bold">
          !
        </div>
        <div>
          <h4 class="text-xs font-bold font-jakarta">
            Peringatan Kritis: Syarat Kehadiran Minimal 75% Belum Terpenuhi
          </h4>
          <p class="text-xs font-inter mt-0.5 text-red-700 leading-relaxed">
            Persentase kehadiran Anda saat ini adalah <strong class="font-mono">{{ myGrade.attendance.attendancePercentage }}%</strong> ({{ myGrade.attendance.attendedSessions }} dari {{ myGrade.attendance.totalSessions }} sesi). Sesuai kebijakan evaluasi akademik ITW, mahasiswa dengan kehadiran di bawah 75.00% otomatis memperoleh huruf mutu <strong class="font-mono">E (0.00)</strong> terlepas dari nilai tugas atau ujian.
          </p>
        </div>
      </div>

      <!-- Success Badge Jika Presensi >= 75% -->
      <div
        v-else-if="myGrade && myGrade.attendance.isEligible"
        class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900"
      >
        <span class="w-2 h-2 rounded-full bg-semantic-success"></span>
        <span class="text-xs font-inter">
          Syarat kelayakan presensi terpenuhi: <strong class="font-mono">{{ myGrade.attendance.attendancePercentage }}%</strong> (Hadir {{ myGrade.attendance.attendedSessions }} dari {{ myGrade.attendance.totalSessions }} sesi). Anda berhak mengikuti UAS.
        </span>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- FITUR UNGGULAN: SIMULASI TARGET NILAI UAS      -->
    <!-- ============================================== -->
    <section class="bg-gradient-to-br from-white to-teal-50/40 rounded-3xl p-6 sm:p-8 shadow-xs border border-teal-200/90 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-academic-navy text-white text-[11px] font-bold font-jakarta mb-2">
            <span>🎯 Inverted PRD Formula Calculator</span>
          </div>
          <h3 class="text-xl font-bold text-academic-navy font-jakarta">
            Simulasi Target Nilai Ujian Akhir Semester (UAS)
          </h3>
          <p class="text-xs text-slate-600 font-inter mt-1 max-w-2xl">
            Hitung skor minimal yang wajib Anda raih pada Ujian Akhir Semester (UAS - Bobot 30%) berdasarkan akumulasi nilai presensi, tugas mandiri, kuis, dan UTS yang telah terkumpul.
          </p>
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 text-right shrink-0">
          <span class="text-[10px] text-slate-400 font-inter block">Poin Berjalan Saat Ini</span>
          <span class="text-xl font-black font-mono text-scholarly-teal block">
            {{ currentPartialWeightedPoints.toFixed(2) }}
          </span>
          <span class="text-[10px] text-slate-500 font-inter">dari total bobot non-UAS (70%)</span>
        </div>
      </div>

      <!-- Quick Selector Tombol Target Huruf Mutu -->
      <div class="space-y-3">
        <label class="text-xs font-bold font-jakarta uppercase tracking-wider text-slate-600">
          Pilih Target Huruf Mutu Anda:
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Target A -->
          <button
            type="button"
            @click="selectedTargetGrade = 'A'"
            class="p-4 rounded-2xl border transition-all text-left relative"
            :class="selectedTargetGrade === 'A' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'"
          >
            <div class="flex items-center justify-between">
              <span class="text-2xl font-black font-mono text-semantic-success">A</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">IP: 4.00</span>
            </div>
            <span class="text-[11px] font-inter text-slate-500 block mt-2">NA &ge; 85.00</span>
            <span class="text-[10px] font-jakarta font-semibold text-deep-ink">Sangat Cemerlang</span>
          </button>

          <!-- Target AB -->
          <button
            type="button"
            @click="selectedTargetGrade = 'AB'"
            class="p-4 rounded-2xl border transition-all text-left relative"
            :class="selectedTargetGrade === 'AB' ? 'bg-teal-50 border-scholarly-teal ring-2 ring-scholarly-teal/40 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'"
          >
            <div class="flex items-center justify-between">
              <span class="text-2xl font-black font-mono text-scholarly-teal">AB</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">IP: 3.50</span>
            </div>
            <span class="text-[11px] font-inter text-slate-500 block mt-2">NA 80.00 - 84.99</span>
            <span class="text-[10px] font-jakarta font-semibold text-deep-ink">Hampir Istimewa</span>
          </button>

          <!-- Target B -->
          <button
            type="button"
            @click="selectedTargetGrade = 'B'"
            class="p-4 rounded-2xl border transition-all text-left relative"
            :class="selectedTargetGrade === 'B' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/40 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'"
          >
            <div class="flex items-center justify-between">
              <span class="text-2xl font-black font-mono text-academic-navy">B</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">IP: 3.00</span>
            </div>
            <span class="text-[11px] font-inter text-slate-500 block mt-2">NA 70.00 - 79.99</span>
            <span class="text-[10px] font-jakarta font-semibold text-deep-ink">Baik</span>
          </button>

          <!-- Custom Target -->
          <button
            type="button"
            @click="selectedTargetGrade = 'CUSTOM'"
            class="p-4 rounded-2xl border transition-all text-left relative"
            :class="selectedTargetGrade === 'CUSTOM' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/40 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-black font-jakarta text-purple-900">Custom</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Slider</span>
            </div>
            <span class="text-[11px] font-mono text-purple-700 block mt-2">Target NA: {{ customTargetNA.toFixed(1) }}</span>
            <span class="text-[10px] font-jakarta font-semibold text-deep-ink">Atur Mandiri</span>
          </button>
        </div>
      </div>

      <!-- Slider Jika Custom Dipilih -->
      <div v-if="selectedTargetGrade === 'CUSTOM'" class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-700 font-jakarta">Geser Target Nilai Akhir (NA):</span>
          <span class="font-mono text-base font-black text-academic-navy">{{ customTargetNA.toFixed(1) }}</span>
        </div>
        <input
          type="range"
          v-model.number="customTargetNA"
          min="55"
          max="100"
          step="0.5"
          class="w-full accent-scholarly-teal h-2 bg-slate-200 rounded-lg cursor-pointer"
        />
      </div>

      <!-- HASIL REKOMENDASI SIMULASI UAS -->
      <div class="p-5 sm:p-6 rounded-2xl bg-white border border-teal-200 shadow-sm space-y-4">
        <!-- Kasus 1: Kehadiran < 75% -->
        <div v-if="myGrade && !myGrade.attendance.isEligible" class="text-semantic-danger space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm font-jakarta">❌ Simulasi Dinonaktifkan:</span>
          </div>
          <p class="text-xs font-inter leading-relaxed text-slate-600">
            Karena kehadiran Anda di bawah 75%, Anda belum memenuhi syarat mengikuti UAS dan nilai akhir Anda otomatis E. Konsultasikan dengan dosen wali atau bagian akademik.
          </p>
        </div>

        <!-- Kasus 2: Target Sudah Tercapai (Skor UAS <= 0) -->
        <div v-else-if="requiredFinalExamScore <= 0" class="text-semantic-success space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🎉</span>
            <h4 class="text-base font-bold font-jakarta text-semantic-success">
              Target Nilai {{ selectedTargetGrade }} Sudah Aman Tercapai!
            </h4>
          </div>
          <p class="text-xs font-inter text-slate-600 leading-relaxed">
            Akumulasi poin berjalan Anda dari Presensi, Tugas, Kuis, dan UTS (<strong class="font-mono text-deep-ink">{{ currentPartialWeightedPoints.toFixed(2) }} poin</strong>) sudah melampaui batas minimal target <strong class="font-mono text-deep-ink">{{ targetThresholdScore.toFixed(2) }}</strong>. Anda bahkan telah mengamankan huruf mutu <strong class="font-mono text-semantic-success">{{ selectedTargetGrade }}</strong> meskipun skor UAS Anda bernilai <strong class="font-mono">0.00</strong>.
          </p>
        </div>

        <!-- Kasus 3: Target Realistis (0 < Skor UAS <= 100) -->
        <div v-else-if="requiredFinalExamScore > 0 && requiredFinalExamScore <= 100" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎯</span>
              <h4 class="text-base font-bold font-jakarta text-academic-navy">
                Skor UAS Minimal yang Dibutuhkan:
              </h4>
            </div>
            <p class="text-xs font-inter text-slate-600 leading-relaxed max-w-xl">
              Untuk mengamankan Huruf Mutu <strong>{{ selectedTargetGrade }}</strong> (Ambang batas NA: <span class="font-mono font-bold">{{ targetThresholdScore.toFixed(2) }}</span>), Anda harus memperoleh skor minimal sebesar <strong class="font-mono text-academic-navy">{{ requiredFinalExamScore }}</strong> dari 100 pada ujian UAS.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center shrink-0 min-w-[160px]">
            <span class="text-[10px] text-scholarly-teal font-inter uppercase tracking-wider block">Target Skor UAS</span>
            <span class="text-3xl font-black font-mono text-scholarly-teal block mt-0.5">
              {{ requiredFinalExamScore }}
            </span>
            <span class="text-[10px] text-slate-400 font-inter">Skala 0 - 100</span>
          </div>
        </div>

        <!-- Kasus 4: Target Tidak Mungkin Secara Matematis (Skor UAS > 100) -->
        <div v-else class="text-amber-alert space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <h4 class="text-base font-bold font-jakarta text-amber-900">
              Target {{ selectedTargetGrade }} Tidak Dapat Dicapai Secara Matematis
            </h4>
          </div>
          <p class="text-xs font-inter text-slate-600 leading-relaxed">
            Untuk mencapai target NA <strong class="font-mono">{{ targetThresholdScore }}</strong>, Anda membutuhkan skor UAS sebesar <strong class="font-mono text-amber-800">{{ requiredFinalExamScore }}</strong> (melebihi batas maksimal 100).
            Berdasarkan poin berjalan saat ini, Nilai Akhir (NA) maksimal yang dapat Anda raih jika memperoleh skor UAS sempurna (100) adalah <strong class="font-mono text-academic-navy">{{ maxPossibleFinalScore.toFixed(2) }}</strong>.
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- RINCIAN CAPAIAN PER KOMPONEN PENILAIAN         -->
    <!-- ============================================== -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Presensi -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
            Presensi ({{ weights.attendance }}%)
          </span>
          <span class="text-xs font-mono font-bold" :class="myGrade?.attendance.isEligible ? 'text-semantic-success' : 'text-semantic-danger'">
            {{ myGrade?.attendance.attendancePercentage }}%
          </span>
        </div>
        <h4 class="text-sm font-bold text-academic-navy font-jakarta">Presensi & Keaktifan</h4>
        <div class="flex justify-between text-xs font-inter pt-2 border-t border-slate-100">
          <span class="text-slate-500">Skor Tertimbang:</span>
          <span class="font-mono font-bold text-deep-ink">{{ myGrade?.attendance.weightedScore.toFixed(2) }} Poin</span>
        </div>
      </div>

      <!-- Tugas -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-teal-100 text-teal-800 uppercase">
            Tugas ({{ weights.assignment }}%)
          </span>
          <span class="text-xs font-mono font-bold text-scholarly-teal">
            Rata: {{ myGrade?.assignment.averageScore.toFixed(1) }}
          </span>
        </div>
        <h4 class="text-sm font-bold text-academic-navy font-jakarta">Tugas Mandiri & Praktikum</h4>
        <div class="flex justify-between text-xs font-inter pt-2 border-t border-slate-100">
          <span class="text-slate-500">Skor Tertimbang:</span>
          <span class="font-mono font-bold text-deep-ink">{{ myGrade?.assignment.weightedScore.toFixed(2) }} Poin</span>
        </div>
      </div>

      <!-- Kuis -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
            Kuis ({{ weights.quiz }}%)
          </span>
          <span class="text-xs font-mono font-bold text-purple-800">
            Rata: {{ myGrade?.quiz.averageScore.toFixed(1) }}
          </span>
        </div>
        <h4 class="text-sm font-bold text-academic-navy font-jakarta">Kuis Terstruktur Mingguan</h4>
        <div class="flex justify-between text-xs font-inter pt-2 border-t border-slate-100">
          <span class="text-slate-500">Skor Tertimbang:</span>
          <span class="font-mono font-bold text-deep-ink">{{ myGrade?.quiz.weightedScore.toFixed(2) }} Poin</span>
        </div>
      </div>

      <!-- UTS -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
            UTS ({{ weights.midterm }}%)
          </span>
          <span class="text-xs font-mono font-bold text-amber-900">
            Skor: {{ myGrade?.midtermExam.score !== null && myGrade?.midtermExam.score !== undefined ? myGrade.midtermExam.score : '-' }}
          </span>
        </div>
        <h4 class="text-sm font-bold text-academic-navy font-jakarta">Ujian Tengah Semester (Sesi 8)</h4>
        <div class="flex justify-between text-xs font-inter pt-2 border-t border-slate-100">
          <span class="text-slate-500">Skor Tertimbang:</span>
          <span class="font-mono font-bold text-deep-ink">{{ myGrade?.midtermExam.weightedScore.toFixed(2) }} Poin</span>
        </div>
      </div>

      <!-- UAS -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-blue-100 text-academic-navy uppercase">
            UAS ({{ weights.finalExam }}%)
          </span>
          <span class="text-xs font-mono font-bold text-academic-navy">
            Skor: {{ myGrade?.finalExam.score !== null && myGrade?.finalExam.score !== undefined ? myGrade.finalExam.score : '-' }}
          </span>
        </div>
        <h4 class="text-sm font-bold text-academic-navy font-jakarta">Ujian Akhir Semester (Sesi 16)</h4>
        <div class="flex justify-between text-xs font-inter pt-2 border-t border-slate-100">
          <span class="text-slate-500">Skor Tertimbang:</span>
          <span class="font-mono font-bold text-deep-ink">{{ myGrade?.finalExam.weightedScore.toFixed(2) }} Poin</span>
        </div>
      </div>
    </section>
  </div>
</template>
