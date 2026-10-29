<script setup lang="ts">
import { computed } from 'vue'
import type { StudentEwsProfileDto } from '~/types'

const props = defineProps<{
  modelValue: boolean
  student: StudentEwsProfileDto | null
  courseName?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const close = () => {
  emit('update:modelValue', false)
}

const isCritical = computed(() => props.student?.overallRiskLevel === 'CRITICAL')
const isWarning = computed(() => props.student?.overallRiskLevel === 'WARNING')
</script>

<template>
  <div v-if="modelValue && student" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-deep-ink/60 backdrop-blur-xs transition-opacity" @click="close"></div>

    <!-- Modal Dialog -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-left space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border"
                :class="isCritical
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : (isWarning ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')"
              >
                Kategori Risiko: {{ student.riskLabel }}
              </span>
              <span class="text-xs font-mono font-semibold text-slate-500">
                Skor Risiko: {{ student.compositeRiskScore.toFixed(0) }}/100
              </span>
            </div>
            <h3 class="text-xl font-bold font-jakarta text-academic-navy">
              {{ student.studentName }}
            </h3>
            <p class="text-xs font-mono text-slate-500">
              NIM: {{ student.studentNim || '-' }} • {{ student.studentEmail }}
            </p>
          </div>

          <button
            type="button"
            @click="close"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 3 Indikator Telemetri Utama -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- 1. Presensi -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-500">Presensi</span>
              <span
                class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                :class="student.attendance.isDisqualified ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ student.attendance.attendancePercentage.toFixed(1) }}%
              </span>
            </div>
            <p class="text-sm font-bold font-mono text-slate-800">
              {{ student.attendance.attendedSessions }} / {{ student.attendance.totalSessions }} Sesi
            </p>
            <p class="text-[10px] text-slate-500">
              Alpa: {{ student.attendance.absentSessions }} • Terlambat: {{ student.attendance.lateSessions }}
            </p>
          </div>

          <!-- 2. Tugas -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-500">Tugas Terkumpul</span>
              <span
                class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                :class="student.assignments.missingCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ student.assignments.submissionRate.toFixed(0) }}%
              </span>
            </div>
            <p class="text-sm font-bold font-mono text-slate-800">
              {{ student.assignments.submittedCount }} / {{ student.assignments.totalAssignments }} Tugas
            </p>
            <p class="text-[10px] text-slate-500">
              Belum Kumpul: {{ student.assignments.missingCount }} • Telat: {{ student.assignments.lateCount }}
            </p>
          </div>

          <!-- 3. Ujian -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-500">Rata-rata Ujian</span>
              <span
                class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                :class="student.exams.isBelowPassingStandard ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
              >
                Std 55.0
              </span>
            </div>
            <p class="text-sm font-bold font-mono text-slate-800">
              {{ student.exams.combinedExamAverage !== null ? student.exams.combinedExamAverage.toFixed(1) : '-' }}
            </p>
            <p class="text-[10px] text-slate-500">
              Kuis: {{ student.exams.quizAverageScore?.toFixed(1) ?? '-' }} • UTS: {{ student.exams.midtermScore?.toFixed(1) ?? '-' }}
            </p>
          </div>
        </div>

        <!-- Rekomendasi Rencana Aksi Intervensi -->
        <div class="space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-scholarly-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Rekomendasi Aksi Intervensi Dini</span>
          </h4>

          <!-- Tindakan Dosen Pengampu -->
          <div class="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
            <span class="text-xs font-bold text-scholarly-teal font-jakarta block">
              1. Aksi Rekomendasi Dosen Pengampu:
            </span>
            <ul class="space-y-1 text-xs text-slate-700 font-inter pl-1">
              <li
                v-for="(action, idx) in student.interventionRecommendations.lecturerActions"
                :key="idx"
                class="flex items-start gap-2"
              >
                <span class="text-scholarly-teal font-bold">•</span>
                <span>{{ action }}</span>
              </li>
            </ul>
          </div>

          <!-- Tindakan Admin Prodi & Dosen Wali -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span class="text-xs font-bold text-slate-800 font-jakarta block">
                2. Admin Program Studi:
              </span>
              <ul class="space-y-1 text-[11px] text-slate-600 font-inter pl-1">
                <li
                  v-for="(action, idx) in student.interventionRecommendations.programAdminActions"
                  :key="idx"
                  class="flex items-start gap-1.5"
                >
                  <span class="text-slate-400 font-bold">•</span>
                  <span>{{ action }}</span>
                </li>
              </ul>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span class="text-xs font-bold text-slate-800 font-jakarta block">
                3. Pembimbing Akademik / Dosen Wali:
              </span>
              <ul class="space-y-1 text-[11px] text-slate-600 font-inter pl-1">
                <li
                  v-for="(action, idx) in student.interventionRecommendations.academicAdvisorActions"
                  :key="idx"
                  class="flex items-start gap-1.5"
                >
                  <span class="text-slate-400 font-bold">•</span>
                  <span>{{ action }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="close"
            class="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs font-jakarta transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
