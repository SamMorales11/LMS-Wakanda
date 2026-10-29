<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useEwsStore } from '~/stores/useEwsStore'

const authStore = useAuthStore()
const academicStore = useAcademicStore()
const ewsStore = useEwsStore()

const isExpanded = ref(true)

const profile = computed(() => ewsStore.myStudentEws)
const isAtRisk = computed(() => ewsStore.isStudentAtRisk)

const loadEws = async () => {
  if (authStore.isStudent && authStore.user?.id && academicStore.selectedClassId) {
    await ewsStore.fetchMyStudentEws(academicStore.selectedClassId, authStore.user.id)
  }
}

watch(
  () => [academicStore.selectedClassId, authStore.user?.id],
  () => {
    loadEws()
  },
  { immediate: true }
)

onMounted(() => {
  loadEws()
})

const isCritical = computed(() => profile.value?.overallRiskLevel === 'CRITICAL')
const isWarning = computed(() => profile.value?.overallRiskLevel === 'WARNING')

const issues = computed(() => {
  if (!profile.value) return []
  const list: string[] = []

  if (profile.value.attendance.isDisqualified) {
    list.push(`Kehadiran Anda saat ini ${profile.value.attendance.attendancePercentage.toFixed(1)}% (di bawah batas minimal 75.0% untuk mengikuti UAS).`)
  } else if (profile.value.attendance.isNearThreshold) {
    list.push(`Kehadiran Anda saat ini ${profile.value.attendance.attendancePercentage.toFixed(1)}% (mendekati ambang batas kelulusan 75.0%).`)
  }

  if (profile.value.assignments.missingCount > 0) {
    list.push(`Terdapat ${profile.value.assignments.missingCount} tugas terstruktur yang belum dikumpulkan.`)
  }

  if (profile.value.assignments.lateCount > 0) {
    list.push(`Terdapat ${profile.value.assignments.lateCount} tugas yang diserahkan melewati batas waktu normal.`)
  }

  if (profile.value.exams.isBelowPassingStandard) {
    const avg = profile.value.exams.combinedExamAverage !== null ? profile.value.exams.combinedExamAverage.toFixed(1) : '0.0'
    list.push(`Rata-rata skor evaluasi kuis/UTS Anda (${avg}) berada di bawah standar kelulusan standar ITW (55.0).`)
  }

  return list
})
</script>

<template>
  <div
    v-if="authStore.isStudent && isAtRisk && profile"
    class="rounded-3xl border transition-all duration-300 overflow-hidden shadow-xs"
    :class="isCritical
      ? 'bg-rose-50/95 border-semantic-danger/40 text-rose-950'
      : 'bg-amber-50/95 border-amber-alert/40 text-amber-950'"
  >
    <!-- Header Banner Bar -->
    <div class="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <!-- Icon Badge -->
        <div
          class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
          :class="isCritical ? 'bg-semantic-danger text-white' : 'bg-amber-alert text-white'"
        >
          <svg v-if="isCritical" class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border"
              :class="isCritical
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'"
            >
              Early Warning System: Kategori {{ profile.riskLabel }}
            </span>
            <span class="text-xs font-mono font-semibold opacity-75">
              Skor Risiko: {{ profile.compositeRiskScore.toFixed(0) }}/100
            </span>
          </div>
          <h4 class="text-sm sm:text-base font-extrabold font-jakarta mt-0.5">
            {{ isCritical ? 'PERINGATAN AKADEMIK KRITIS: Kelayakan Kelulusan Anda Dalam Risiko' : 'PERINGATAN DINI AKADEMIK: Pantauan Nilai & Presensi Anda' }}
          </h4>
        </div>
      </div>

      <!-- Action: Toggle Collapse -->
      <button
        type="button"
        @click="isExpanded = !isExpanded"
        class="p-2 rounded-xl hover:bg-black/5 transition text-xs font-bold font-jakarta shrink-0 flex items-center gap-1 opacity-80 hover:opacity-100"
      >
        <span class="hidden sm:inline">{{ isExpanded ? 'Sembunyikan' : 'Rincian' }}</span>
        <svg
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Expanded Details Section -->
    <div v-if="isExpanded" class="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 pt-1 border-t border-black/5">
      <div class="space-y-1.5">
        <span class="text-xs font-bold uppercase tracking-wider font-mono opacity-80 block">
          Indikator Masalah Terdeteksi Sistem:
        </span>
        <ul class="space-y-1 text-xs font-inter pl-1">
          <li v-for="(issue, idx) in issues" :key="idx" class="flex items-start gap-2">
            <span class="text-sm font-bold" :class="isCritical ? 'text-semantic-danger' : 'text-amber-alert'">•</span>
            <span>{{ issue }}</span>
          </li>
        </ul>
      </div>

      <!-- Rekomendasi Tindakan Mandiri Mahasiswa -->
      <div
        class="p-3 rounded-2xl bg-white/80 border text-xs font-inter flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        :class="isCritical ? 'border-rose-200' : 'border-amber-200'"
      >
        <div class="space-y-0.5">
          <span class="font-bold font-jakarta block text-slate-800">
            Langkah Penyelamatan Akademik Disarankan:
          </span>
          <p class="text-slate-600 text-[11px]">
            Segera konsultasikan kondisi akademik Anda dengan Dosen Pengampu mata kuliah atau hubungi Dosen Wali untuk perencanaan perbaikan.
          </p>
        </div>

        <a
          href="#student-grades"
          class="px-3.5 py-2 rounded-xl text-xs font-bold font-jakarta transition whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 shrink-0"
          :class="isCritical ? 'bg-semantic-danger text-white hover:bg-red-700' : 'bg-amber-alert text-white hover:bg-amber-700'"
        >
          <span>Simulasi Target UAS</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>
