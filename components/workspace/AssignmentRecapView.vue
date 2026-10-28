<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAssignmentStore } from '~/stores/useAssignmentStore'
import type { AssignmentDto, SubmissionDto, ApiResponse } from '~/types'
import SubmitAssignmentModal from './SubmitAssignmentModal.vue'
import AssignmentSubmissionsModal from './AssignmentSubmissionsModal.vue'

const academicStore = useAcademicStore()
const authStore = useAuthStore()
const assignmentStore = useAssignmentStore()

const currentClass = computed(() => academicStore.selectedClassDetail || academicStore.selectedClass)
const classAssignments = ref<AssignmentDto[]>([])
const isLoading = ref(false)

// Modals
const isSubmitModalOpen = ref(false)
const selectedAssignmentForSubmit = ref<AssignmentDto | null>(null)
const isSubmissionsOverviewOpen = ref(false)

const loadClassAssignments = async () => {
  if (!currentClass.value?.id) return
  isLoading.value = true

  try {
    const res = await $fetch<ApiResponse<AssignmentDto[]>>(
      `/api/classes/${currentClass.value.id}/assignments`
    )
    if (res.success && res.data) {
      classAssignments.value = res.data
    } else {
      classAssignments.value = []
    }
  } catch (err) {
    console.warn('[AssignmentRecapView] Gagal memuat tugas kelas:', err)
    classAssignments.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => currentClass.value?.id,
  () => {
    loadClassAssignments()
  },
  { immediate: true }
)

onMounted(() => {
  loadClassAssignments()
})

// Metrik Pengumpulan Mahasiswa
const studentStats = computed(() => {
  const total = classAssignments.value.length
  let submitted = 0
  let onTime = 0
  let late = 0
  let totalScore = 0
  let gradedCount = 0

  classAssignments.value.forEach(a => {
    if (a.mySubmission) {
      submitted++
      if (a.mySubmission.isLate) late++
      else onTime++

      if (a.mySubmission.score) {
        totalScore += parseFloat(a.mySubmission.score)
        gradedCount++
      }
    }
  })

  return {
    total,
    submitted,
    onTime,
    late,
    avgScore: gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : '-'
  }
})

// Metrik Dosen
const lecturerStats = computed(() => {
  const totalAssignments = classAssignments.value.length
  let totalSubmissions = 0

  classAssignments.value.forEach(a => {
    totalSubmissions += a.submissionCount || 0
  })

  return {
    totalAssignments,
    totalSubmissions
  }
})

// Modal Openers
const handleOpenSubmit = (a: AssignmentDto) => {
  selectedAssignmentForSubmit.value = a
  isSubmitModalOpen.value = true
}

const handleOpenOverview = async (a: AssignmentDto) => {
  await assignmentStore.fetchAssignmentOverview(a.id)
  isSubmissionsOverviewOpen.value = true
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header Banner -->
    <div class="p-6 rounded-3xl bg-academic-navy text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 font-mono text-xs font-semibold border border-teal-400/30">
            {{ currentClass?.courseCode || 'KODE MK' }} • Kelas {{ currentClass?.code || 'A' }}
          </span>
          <span class="text-xs text-slate-300 font-inter">Semester Aktif 2026/2027</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold font-jakarta">
          {{ authStore.isStudent ? 'Portofolio & Pengumpulan Tugas Mahasiswa' : 'Rekapitulasi Tugas & Penilaian Mahasiswa' }}
        </h2>
        <p class="text-xs text-slate-300 font-inter max-w-xl">
          Pengunggahan berkas tugas (PDF/ZIP) divalidasi dengan Strict Server-Side Timestamp: status <strong>Tepat Waktu (#16A34A)</strong> dan <strong>Terlambat (#DC2626)</strong>.
        </p>
      </div>

      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[130px]">
        <span class="text-[10px] text-teal-300 uppercase font-mono font-bold block">Total Tugas</span>
        <span class="text-2xl font-black font-mono text-white block mt-0.5">{{ classAssignments.length }}</span>
        <span class="text-[10px] text-slate-300 font-inter block">Semester Aktif</span>
      </div>
    </div>

    <!-- Metrik Bar Mahasiswa -->
    <div v-if="authStore.isStudent" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
        <span class="text-[11px] text-slate-500 font-inter">Tugas Dikumpulkan</span>
        <p class="text-2xl font-black font-mono text-academic-navy">
          {{ studentStats.submitted }} <span class="text-xs text-slate-400 font-mono">/ {{ studentStats.total }}</span>
        </p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
        <span class="text-[11px] text-semantic-success font-inter">Tepat Waktu (#16A34A)</span>
        <p class="text-2xl font-black font-mono text-semantic-success">{{ studentStats.onTime }}</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
        <span class="text-[11px] text-semantic-danger font-inter">Terlambat (#DC2626)</span>
        <p class="text-2xl font-black font-mono text-semantic-danger">{{ studentStats.late }}</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
        <span class="text-[11px] text-scholarly-teal font-inter">Rata-rata Nilai</span>
        <p class="text-2xl font-black font-mono text-scholarly-teal">{{ studentStats.avgScore }}</p>
      </div>
    </div>

    <!-- Metrik Bar Dosen -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-2 gap-4">
      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
        <span class="text-[11px] text-slate-500 font-inter">Total Tugas Perkuliahan</span>
        <p class="text-2xl font-black font-mono text-academic-navy">{{ lecturerStats.totalAssignments }} Penugasan</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
        <span class="text-[11px] text-scholarly-teal font-inter">Total Berkas Pengumpulan</span>
        <p class="text-2xl font-black font-mono text-scholarly-teal">{{ lecturerStats.totalSubmissions }} Berkas Masuk</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-10 text-center space-y-2">
      <div class="w-7 h-7 border-2 border-scholarly-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs text-slate-400 font-inter">Memuat rekapitulasi penugasan...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="classAssignments.length === 0" class="p-12 text-center rounded-3xl bg-white border border-slate-200/90 space-y-3">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">
        📝
      </div>
      <div class="space-y-1">
        <h4 class="text-sm font-bold text-academic-navy font-jakarta">Belum Ada Tugas Perkuliahan</h4>
        <p class="text-xs text-slate-500 font-inter max-w-sm mx-auto">
          Belum ada penugasan yang dibuat pada kelas ini.
        </p>
      </div>
    </div>

    <!-- Daftar Kartu Tugas -->
    <div v-else class="space-y-4">
      <div
        v-for="a in classAssignments"
        :key="a.id"
        class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4 transition hover:border-academic-navy"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-blue-50 text-academic-navy border border-blue-200">
                {{ a.sessionNumber ? `Pertemuan ${a.sessionNumber}` : 'Tugas Mandiri' }}
              </span>
              <span class="text-[10px] font-mono text-slate-400">
                Maks: {{ a.maxScore }} Poin
              </span>
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
            </div>

            <h3 class="text-base font-bold text-academic-navy font-jakarta">
              {{ a.title }}
            </h3>

            <p v-if="a.description" class="text-xs text-slate-600 line-clamp-2">
              {{ a.description }}
            </p>
          </div>

          <!-- Schedule Meta -->
          <div class="text-xs font-mono space-y-1 shrink-0 p-3 rounded-2xl bg-alabaster-slate border border-slate-200 min-w-[220px]">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-500">Batas Normal:</span>
              <span class="font-bold text-academic-navy">
                {{ new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>
            <div v-if="a.cutoffDate" class="flex items-center justify-between text-[11px]">
              <span class="text-slate-500">Batas Cutoff:</span>
              <span class="font-bold text-amber-800">
                {{ new Date(a.cutoffDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Student Submission Section -->
        <div v-if="authStore.isStudent" class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div v-if="a.mySubmission" class="flex items-center gap-3">
            <span
              class="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold text-white uppercase"
              :style="{ backgroundColor: a.mySubmission.timingColor }"
            >
              ● {{ a.mySubmission.timingLabel }}
            </span>
            <div class="text-xs font-inter text-slate-500">
              Dikumpulkan pada: <strong class="font-mono text-slate-700">{{ new Date(a.mySubmission.submittedAt).toLocaleString('id-ID') }}</strong>
            </div>
            <div v-if="a.mySubmission.status === 'GRADED'" class="text-xs font-bold font-mono text-scholarly-teal">
              Nilai: {{ a.mySubmission.score }} / {{ a.maxScore }}
            </div>
          </div>

          <div v-else class="text-xs text-slate-400 font-inter">
            Status: <span class="text-amber-alert font-bold">Belum Mengumpulkan</span>
          </div>

          <div>
            <button
              v-if="a.isClosed"
              type="button"
              disabled
              class="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs font-jakarta cursor-not-allowed"
            >
              Akses Ditutup (Melewati Cutoff)
            </button>
            <button
              v-else
              type="button"
              @click="handleOpenSubmit(a)"
              class="px-4 py-2 rounded-xl text-white font-semibold text-xs font-jakarta transition shadow-xs"
              :class="a.isExpired ? 'bg-semantic-danger hover:bg-red-700' : 'bg-scholarly-teal hover:bg-teal-700'"
            >
              {{ a.mySubmission ? 'Unggah Ulang Berkas' : 'Kirim Tugas Sekarang' }}
            </button>
          </div>
        </div>

        <!-- Lecturer Action Section -->
        <div v-else class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div class="text-xs font-inter text-slate-600">
            Total Pengumpulan Mahasiswa: <strong class="font-mono text-academic-navy">{{ a.submissionCount || 0 }} berkas</strong>
          </div>

          <button
            type="button"
            @click="handleOpenOverview(a)"
            class="px-4 py-2 rounded-xl bg-academic-navy hover:bg-blue-900 text-white font-semibold text-xs font-jakarta transition shadow-xs flex items-center gap-1.5"
          >
            <span>📊 Lihat Pengumpulan & Beri Nilai</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <SubmitAssignmentModal
      :is-open="isSubmitModalOpen"
      :assignment="selectedAssignmentForSubmit"
      @close="isSubmitModalOpen = false"
      @submitted="loadClassAssignments"
    />

    <AssignmentSubmissionsModal
      :is-open="isSubmissionsOverviewOpen"
      :overview="assignmentStore.currentOverview"
      @close="isSubmissionsOverviewOpen = false"
      @graded="loadClassAssignments"
    />
  </div>
</template>
